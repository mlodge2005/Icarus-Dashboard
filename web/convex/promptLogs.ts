import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("promptLogs").collect()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 300),
});

export const append = mutation({
  args: {
    promptSummary: v.string(),
    actionSummary: v.string(),
    source: v.optional(v.string()),
    now: v.string(),
  },
  handler: async (ctx, a) => {
    return await ctx.db.insert("promptLogs", {
      promptSummary: a.promptSummary.trim(),
      actionSummary: a.actionSummary.trim(),
      source: a.source,
      createdAt: a.now,
    });
  },
});
