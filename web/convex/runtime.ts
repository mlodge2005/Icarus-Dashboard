import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const list = query({ args: {}, handler: async (ctx) => ctx.db.query("runtimeMonitors").collect() });

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
    const laptopIp = process.env.MARKS_DESKTOP_IP ?? "100.119.18.116";
    const gatewayUrl = process.env.OPENCLAW_GATEWAY_STATUS_URL ?? `http://${laptopIp}:18789`;
    const desktopUrl = process.env.MARKS_DESKTOP_BROWSER_URL ?? `http://${laptopIp}`;
    const mediums = (process.env.OPENCLAW_ACTIVE_MEDIA ?? "webchat,discord").split(",").map(s=>s.trim()).filter(Boolean);

    const gw = await checkUrl(gatewayUrl);
    await ctx.runMutation(api.runtime.upsert, { key: "openclaw_gateway", label: "OpenClaw Gateway", medium: "gateway", target: gatewayUrl, status: gw.status, details: gw.details, now });

    const desk = await checkUrl(desktopUrl);
    await ctx.runMutation(api.runtime.upsert, { key: "marks_desktop_browser", label: "Marks Desktop Browser", medium: "tailscale", target: desktopUrl, status: desk.status, details: desk.details, now });

    const mediumStatus = mediums.length ? "online" : "unknown";
    await ctx.runMutation(api.runtime.upsert, { key: "openclaw_mediums", label: "OpenClaw Active Mediums", medium: "channels", target: mediums.join(", "), status: mediumStatus, details: `${mediums.length} medium(s) configured`, now });

    return { ok: true, checkedAt: now };
  },
});
