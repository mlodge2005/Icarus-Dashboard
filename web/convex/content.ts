import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity } from "./lib/activity";
const status = v.union(v.literal("ideas"), v.literal("drafts"), v.literal("published"));
export const list = query({ args: {}, handler: async (ctx) => ctx.db.query("contentItems").collect() });
export const create = mutation({
  args: { title: v.string(), platform: v.string(), hook: v.string(), status, link: v.optional(v.string()), tags: v.array(v.string()), now: v.string() },
  handler: async (ctx, a) => {
    const id = await ctx.db.insert("contentItems", { title: a.title, platform: a.platform, hook: a.hook, status: a.status, link: a.link, tags: a.tags, createdAt: a.now, updatedAt: a.now });
    await appendActivity(ctx, { eventType: "content_created", entityType: "content", entityId: id, payload: JSON.stringify({ title: a.title }), createdAt: a.now });
    return id;
  }
});
export const update = mutation({ args: { id: v.id("contentItems"), title: v.optional(v.string()), platform: v.optional(v.string()), hook: v.optional(v.string()), status: v.optional(status), link: v.optional(v.string()), tags: v.optional(v.array(v.string())), now: v.string() }, handler: async (ctx, a) => { const c = await ctx.db.get(a.id); if (!c) throw new Error("Content not found"); await ctx.db.patch(a.id, { title: a.title ?? c.title, platform: a.platform ?? c.platform, hook: a.hook ?? c.hook, status: a.status ?? c.status, link: a.link ?? c.link, tags: a.tags ?? c.tags, updatedAt: a.now }); return a.id; } });
