import { query } from "./_generated/server";

export const status = query({
  args: {},
  handler: async (ctx) => {
    const latestRun = (await ctx.db.query("protocolRuns").collect()).sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
    const blockedTasks = (await ctx.db.query("tasks").collect()).filter((t) => (t.tags ?? []).includes("blocked")).length;
    const gateway = await ctx.db.query("runtimeMonitors").withIndex("by_key", (q) => q.eq("key", "openclaw_gateway")).first();
    const recentLogs = (await ctx.db.query("runtimeLogs").collect()).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    const latestProcessingLog = recentLogs.find((l) => !(l.source === "runtime" && (l.action === "probe_started" || l.action === "probe_completed")));
    const processing = !!latestProcessingLog && (Date.now() - new Date(latestProcessingLog.createdAt).getTime()) < 15000;

    if (latestRun?.status === "running") return { label: "Running", tone: "#0a7", detail: "Protocol execution in progress", gateway: gateway?.status ?? "unknown", processing };
    if (blockedTasks > 0) return { label: "Blocked", tone: "#c73", detail: `${blockedTasks} blocked task(s)`, gateway: gateway?.status ?? "unknown", processing };
    return { label: "Idle", tone: "#666", detail: "No active protocol run", gateway: gateway?.status ?? "unknown", processing };
  },
});
