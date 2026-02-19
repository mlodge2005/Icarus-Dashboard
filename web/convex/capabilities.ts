import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({ args: {}, handler: async (ctx) => ctx.db.query("capabilities").collect() });

export const upsert = mutation({
  args: {
    name: v.string(),
    status: v.union(v.literal("available"), v.literal("degraded"), v.literal("blocked")),
    requirement: v.string(),
    lastResult: v.optional(v.string()),
    fixHint: v.optional(v.string()),
    now: v.string(),
  },
  handler: async (ctx, a) => {
    const existing = await ctx.db.query("capabilities").withIndex("by_name", (q) => q.eq("name", a.name)).first();
    if (existing) {
      await ctx.db.patch(existing._id, { status: a.status, requirement: a.requirement, lastResult: a.lastResult, fixHint: a.fixHint, lastCheckedAt: a.now, updatedAt: a.now });
      return existing._id;
    }
    return await ctx.db.insert("capabilities", { name: a.name, status: a.status, requirement: a.requirement, lastResult: a.lastResult, fixHint: a.fixHint, lastCheckedAt: a.now, updatedAt: a.now });
  },
});

export const autoProbe = mutation({
  args: { now: v.string() },
  handler: async (ctx, a) => {
    const checks = [
      { name: "GitHub Push", status: "available" as const, requirement: "SSH key configured", lastResult: "Assumed available (last push succeeded)", fixHint: "Verify by pushing a no-op commit if uncertain" },
      { name: "Convex Deploy", status: process.env.CONVEX_DEPLOYMENT ? ("available" as const) : ("blocked" as const), requirement: "CONVEX_DEPLOYMENT", lastResult: process.env.CONVEX_DEPLOYMENT ? "env present" : "missing env", fixHint: "Set CONVEX_DEPLOYMENT" },
      { name: "Agent API Auth", status: process.env.AGENT_KEY ? ("available" as const) : ("blocked" as const), requirement: "AGENT_KEY", lastResult: process.env.AGENT_KEY ? "env present" : "missing env", fixHint: "Set AGENT_KEY" },
    ];

    const ids: string[] = [];
    for (const c of checks) {
      const existing = await ctx.db.query("capabilities").withIndex("by_name", (q) => q.eq("name", c.name)).first();
      if (existing) {
        await ctx.db.patch(existing._id, { ...c, lastCheckedAt: a.now, updatedAt: a.now });
        ids.push(existing._id);
      } else {
        ids.push(await ctx.db.insert("capabilities", { ...c, lastCheckedAt: a.now, updatedAt: a.now }));
      }
    }
    return ids;
  },
});
