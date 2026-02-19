import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity } from "./lib/activity";

export const listGlobal = query({ args: {}, handler: async (ctx) => (await ctx.db.query("activityEvents").collect()).sort((a,b)=> b.createdAt.localeCompare(a.createdAt)) });
export const append = mutation({ args: { eventType: v.string(), entityType: v.string(), entityId: v.string(), payload: v.string(), now: v.string() }, handler: async (ctx, a) => { await appendActivity(ctx, { ...a, createdAt: a.now }); return true; } });
