import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity } from "./lib/activity";

export const list = query({ args: {}, handler: async (ctx) => ctx.db.query("projects").collect() });
export const create = mutation({
  args: { name: v.string(), description: v.optional(v.string()), now: v.string() },
  handler: async (ctx, a) => {
    const id = await ctx.db.insert("projects", { name: a.name, description: a.description, createdAt: a.now, updatedAt: a.now });
    await appendActivity(ctx, { eventType: "project_created", entityType: "project", entityId: id, payload: JSON.stringify({ name: a.name }), createdAt: a.now });
    return id;
  }
});
