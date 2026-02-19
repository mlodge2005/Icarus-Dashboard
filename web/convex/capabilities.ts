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
    return await ctx.db.insert("capabilities", { ...a, lastCheckedAt: a.now, updatedAt: a.now });
  },
});
