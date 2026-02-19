import { query } from "./_generated/server";

export const status = query({
  args: {},
  handler: async (ctx) => {
    const latestRun = (await ctx.db.query("protocolRuns").collect()).sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
    const blockedTasks = (await ctx.db.query("tasks").collect()).filter((t) => (t.tags ?? []).includes("blocked")).length;

    if (latestRun?.status === "running") return { label: "Running", tone: "#0a7", detail: "Protocol execution in progress" };
    if (blockedTasks > 0) return { label: "Blocked", tone: "#c73", detail: `${blockedTasks} blocked task(s)` };
    return { label: "Idle", tone: "#666", detail: "No active protocol run" };
  },
});
