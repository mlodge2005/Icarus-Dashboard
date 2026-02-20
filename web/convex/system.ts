import { query } from "./_generated/server";

export const status = query({
  args: {},
  handler: async (ctx) => {
    const latestRun = (await ctx.db.query("protocolRuns").collect()).sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
    const blockedTasks = (await ctx.db.query("tasks").collect()).filter((t) => (t.tags ?? []).includes("blocked")).length;
    const gateway = await ctx.db.query("runtimeMonitors").withIndex("by_key", (q) => q.eq("key", "openclaw_gateway")).first();
    const procState = await ctx.db.query("processingState").withIndex("by_key", (q) => q.eq("key", "assistant")).first();
    const processing = !!procState?.processing && (!procState.timeoutAt || Date.now() <= new Date(procState.timeoutAt).getTime());

    if (latestRun?.status === "running") return { label: "Running", tone: "#0a7", detail: "Protocol execution in progress", gateway: gateway?.status ?? "unknown", processing };
    if (blockedTasks > 0) return { label: "Blocked", tone: "#c73", detail: `${blockedTasks} blocked task(s)`, gateway: gateway?.status ?? "unknown", processing };
    return { label: "Idle", tone: "#666", detail: "No active protocol run", gateway: gateway?.status ?? "unknown", processing };
  },
});
