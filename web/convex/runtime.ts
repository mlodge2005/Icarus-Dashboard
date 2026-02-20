import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const list = query({ args: {}, handler: async (ctx) => ctx.db.query("runtimeMonitors").collect() });
export const recentLogs = query({ args: {}, handler: async (ctx) => (await ctx.db.query("runtimeLogs").collect()).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,100) });

export const log = mutation({
  args: {
    source: v.string(),
    action: v.string(),
    detail: v.optional(v.string()),
    level: v.union(v.literal("info"), v.literal("start"), v.literal("end"), v.literal("error")),
    now: v.string(),
  },
  handler: async (ctx, a) => ctx.db.insert("runtimeLogs", { source: a.source, action: a.action, detail: a.detail, level: a.level, createdAt: a.now }),
});

export const setProcessing = mutation({
  args: { processing: v.boolean(), reason: v.optional(v.string()), now: v.string(), timeoutSeconds: v.optional(v.number()) },
  handler: async (ctx, a) => {
    const existing = await ctx.db.query("processingState").withIndex("by_key", (q) => q.eq("key", "assistant")).first();
    const timeoutSeconds = Math.max(10, Math.min(3600, a.timeoutSeconds ?? 120));
    const timeoutAt = a.processing ? new Date(new Date(a.now).getTime() + timeoutSeconds * 1000).toISOString() : a.now;
    if (existing) {
      await ctx.db.patch(existing._id, { processing: a.processing, reason: a.reason, timeoutAt, updatedAt: a.now });
      return existing._id;
    }
    return await ctx.db.insert("processingState", { key: "assistant", processing: a.processing, reason: a.reason, timeoutAt, updatedAt: a.now });
  },
});

export const failSafeTick = mutation({
  args: { now: v.string() },
  handler: async (ctx, a) => {
    const state = await ctx.db.query("processingState").withIndex("by_key", (q) => q.eq("key", "assistant")).first();
    if (!state || !state.processing) return { changed: false };
    const gateway = await ctx.db.query("runtimeMonitors").withIndex("by_key", (q) => q.eq("key", "openclaw_gateway")).first();
    const timedOut = !!state.timeoutAt && new Date(a.now).getTime() > new Date(state.timeoutAt).getTime();
    const gatewayDown = gateway?.status === "offline";
    if (timedOut || gatewayDown) {
      const reason = timedOut ? "failsafe_timeout" : "failsafe_gateway_offline";
      await ctx.db.patch(state._id, { processing: false, reason, timeoutAt: a.now, updatedAt: a.now });
      await ctx.db.insert("runtimeLogs", { source: "runtime", action: "processing_failsafe", detail: reason, level: "error", createdAt: a.now });
      return { changed: true, reason };
    }
    return { changed: false };
  },
});

export const upsert = mutation({
  args: {
    key: v.string(),
    label: v.string(),
    medium: v.string(),
    target: v.string(),
    status: v.union(v.literal("online"), v.literal("offline"), v.literal("unknown")),
    details: v.optional(v.string()),
    now: v.string(),
  },
  handler: async (ctx, a) => {
    const existing = await ctx.db.query("runtimeMonitors").withIndex("by_key", (q) => q.eq("key", a.key)).first();
    if (existing) {
      await ctx.db.patch(existing._id, { label: a.label, medium: a.medium, target: a.target, status: a.status, details: a.details, lastCheckedAt: a.now, updatedAt: a.now });
      return existing._id;
    }
    return await ctx.db.insert("runtimeMonitors", { key: a.key, label: a.label, medium: a.medium, target: a.target, status: a.status, details: a.details, lastCheckedAt: a.now, updatedAt: a.now });
  },
});

async function checkUrl(url: string): Promise<{status:"online"|"offline"|"unknown";details:string}> {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 3000);
    const res = await fetch(url, { method: "GET", signal: c.signal });
    clearTimeout(t);
    return res.ok ? { status: "online", details: `HTTP ${res.status}` } : { status: "offline", details: `HTTP ${res.status}` };
  } catch (e) {
    return { status: "offline", details: (e as Error).message };
  }
}

export const probe = action({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    await ctx.runMutation(api.runtime.log as any, { source: "runtime", action: "probe_started", level: "start", now });

    const laptopIp = process.env.MARKS_DESKTOP_IP ?? "100.119.18.116";
    const gatewayUrl = process.env.OPENCLAW_GATEWAY_STATUS_URL ?? `http://${laptopIp}:18789`;
    const gatewayExists = (process.env.OPENCLAW_GATEWAY_EXISTS ?? "true").toLowerCase() === "true";
    const desktopUrl = process.env.MARKS_DESKTOP_BROWSER_URL ?? `http://${laptopIp}`;
    const mediums = (process.env.OPENCLAW_ACTIVE_MEDIA ?? "webchat,discord,tui").split(",").map(s=>s.trim()).filter(Boolean);

    const gw = gatewayExists ? { status: "online" as const, details: "Gateway declared available by runtime" } : await checkUrl(gatewayUrl);
    await ctx.runMutation(api.runtime.upsert as any, { key: "openclaw_gateway", label: "OpenClaw Gateway", medium: "gateway", target: gatewayUrl, status: gw.status, details: gw.details, now });

    const desk = await checkUrl(desktopUrl);
    await ctx.runMutation(api.runtime.upsert as any, { key: "marks_desktop_browser", label: "Marks Desktop Browser", medium: "tailscale", target: desktopUrl, status: desk.status, details: desk.details, now });

    const mediumStatus = mediums.length ? "online" : "unknown";
    await ctx.runMutation(api.runtime.upsert as any, { key: "openclaw_mediums", label: "OpenClaw Active Mediums", medium: "channels", target: mediums.join(", "), status: mediumStatus, details: `${mediums.length} medium(s) configured`, now });

    await ctx.runMutation(api.runtime.log as any, { source: "runtime", action: "probe_completed", detail: `gateway=${gw.status}; desktop=${desk.status}; mediums=${mediums.join(",")}`, level: "end", now: new Date().toISOString() });

    return { ok: true, checkedAt: now };
  },
});
