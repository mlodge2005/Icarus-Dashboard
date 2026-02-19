import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity } from "./lib/activity";

export const list = query({ args: {}, handler: async (ctx) => ctx.db.query("documents").collect() });
export const create = mutation({ args: { title: v.string(), url: v.optional(v.string()), note: v.optional(v.string()), now: v.string() }, handler: async (ctx, a) => ctx.db.insert("documents", { ...a, createdAt: a.now, updatedAt: a.now }) });
export const attachToTask = mutation({ args: { taskId: v.id("tasks"), documentId: v.id("documents"), now: v.string() }, handler: async (ctx, a) => { await ctx.db.insert("taskDocuments", { ...a, createdAt: a.now }); await appendActivity(ctx, { eventType: "document_attached", entityType: "task", entityId: a.taskId, payload: JSON.stringify({ taskId: a.taskId, documentId: a.documentId }), createdAt: a.now }); return true; } });
