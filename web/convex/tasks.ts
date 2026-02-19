import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity } from "./lib/activity";

const status = v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"));
const priority = v.union(v.literal("low"), v.literal("medium"), v.literal("high"));

export const list = query({ args: {}, handler: async (ctx) => ctx.db.query("tasks").collect() });

export const create = mutation({
  args: { title: v.string(), description: v.optional(v.string()), status, priority, dueDate: v.optional(v.string()), tags: v.array(v.string()), projectId: v.optional(v.id("projects")), externalLinks: v.array(v.string()), now: v.string() },
  handler: async (ctx, a) => {
    const id = await ctx.db.insert("tasks", {
      title: a.title,
      description: a.description,
      status: a.status,
      priority: a.priority,
      dueDate: a.dueDate,
      tags: a.tags,
      projectId: a.projectId,
      externalLinks: a.externalLinks,
      createdAt: a.now,
      updatedAt: a.now,
    });
    await appendActivity(ctx, { eventType: "task_created", entityType: "task", entityId: id, payload: JSON.stringify({ title: a.title }), createdAt: a.now });
    return id;
  }
});

export const update = mutation({
  args: { id: v.id("tasks"), title: v.optional(v.string()), description: v.optional(v.string()), priority: v.optional(priority), dueDate: v.optional(v.string()), tags: v.optional(v.array(v.string())), externalLinks: v.optional(v.array(v.string())), now: v.string() },
  handler: async (ctx, a) => {
    const task = await ctx.db.get(a.id); if (!task) throw new Error("Task not found");
    const patch = { title: a.title ?? task.title, description: a.description ?? task.description, priority: a.priority ?? task.priority, dueDate: a.dueDate ?? task.dueDate, tags: a.tags ?? task.tags, externalLinks: a.externalLinks ?? task.externalLinks, updatedAt: a.now };
    await ctx.db.patch(a.id, patch);
    await appendActivity(ctx, { eventType: "task_updated", entityType: "task", entityId: a.id, payload: JSON.stringify({ title: patch.title, taskId: a.id }), createdAt: a.now });
    return a.id;
  }
});

export const moveStatus = mutation({
  args: { id: v.id("tasks"), to: status, now: v.string() },
  handler: async (ctx, a) => {
    const task = await ctx.db.get(a.id); if (!task) throw new Error("Task not found");
    await ctx.db.patch(a.id, { status: a.to, updatedAt: a.now });
    await appendActivity(ctx, { eventType: "task_status_changed", entityType: "task", entityId: a.id, payload: JSON.stringify({ from: task.status, to: a.to, taskId: a.id }), createdAt: a.now });
    return a.id;
  }
});

export const taskActivity = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, a) => ctx.db.query("activityEvents").withIndex("by_entity", (q) => q.eq("entityType", "task").eq("entityId", a.taskId)).collect()
});
