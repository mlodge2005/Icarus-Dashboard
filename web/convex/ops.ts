import { query } from "./_generated/server";

export const snapshot = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    const now = tasks.filter((t) => t.status === "in_progress").slice(0, 3);
    const next = tasks.filter((t) => t.status === "todo").slice(0, 5);
    const blocked = tasks.filter((t) => (t.tags ?? []).includes("blocked")).slice(0, 5);
    const latestActivity = (await ctx.db.query("activityEvents").collect())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 25);
    return { now, next, blocked, latestActivity };
  },
});
