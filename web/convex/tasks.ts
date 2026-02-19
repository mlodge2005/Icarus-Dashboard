import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity } from "./lib/activity";

const status = v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"));
const priority = v.union(v.literal("low"), v.literal("medium"), v.literal("high"));
const blockerReason = v.union(v.literal("missing_credential"), v.literal("needs_approval"), v.literal("dependency_down"), v.literal("ambiguous_input"), v.literal("other"));

export const list = query({ args: {}, handler: async (ctx) => ctx.db.query("tasks").collect() });

export const create = mutation({
  args: { title: v.string(), description: v.optional(v.string()), status, priority, dueDate: v.optional(v.string()), tags: v.array(v.string()), blockerReason: v.optional(blockerReason), projectId: v.optional(v.id("projects")), externalLinks: v.array(v.string()), now: v.string() },
  handler: async (ctx, a) => {
    const id = await ctx.db.insert("tasks", {
      title: a.title,
      description: a.description,
      status: a.status,
      priority: a.priority,
      dueDate: a.dueDate,
      tags: a.tags,
      blockerReason: a.blockerReason,
      projectId: a.projectId,
      externalLinks: a.externalLinks,
      createdAt: a.now,
      updatedAt: a.now,
    });
    await appendActivity(ctx, { eventType: "task_created", entityType: "task", entityId: id, payload: JSON.stringify({ title: a.title, blockerReason: a.blockerReason ?? null }), createdAt: a.now });
    return id;
  }
});

export const update = mutation({
  args: { id: v.id("tasks"), title: v.optional(v.string()), description: v.optional(v.string()), priority: v.optional(priority), dueDate: v.optional(v.string()), tags: v.optional(v.array(v.string())), blockerReason: v.optional(blockerReason), externalLinks: v.optional(v.array(v.string())), now: v.string() },
  handler: async (ctx, a) => {
    const task = await ctx.db.get(a.id); if (!task) throw new Error("Task not found");
    const patch = {
      title: a.title ?? task.title,
      description: a.description ?? task.description,
      priority: a.priority ?? task.priority,
      dueDate: a.dueDate ?? task.dueDate,
      tags: a.tags ?? task.tags,
      blockerReason: a.blockerReason ?? task.blockerReason,
      externalLinks: a.externalLinks ?? task.externalLinks,
      updatedAt: a.now,
    };
    await ctx.db.patch(a.id, patch);
    await appendActivity(ctx, { eventType: "task_updated", entityType: "task", entityId: a.id, payload: JSON.stringify({ title: patch.title, blockerReason: patch.blockerReason ?? null, taskId: a.id }), createdAt: a.now });
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

export const resolveBlocker = mutation({
  args: { id: v.id("tasks"), resumeStatus: v.optional(status), now: v.string() },
  handler: async (ctx, a) => {
    const task = await ctx.db.get(a.id); if (!task) throw new Error("Task not found");
    const nextTags = (task.tags ?? []).filter((t) => t !== "blocked");
    const nextStatus = a.resumeStatus ?? (task.status === "done" ? "done" : "in_progress");
    await ctx.db.patch(a.id, { blockerReason: undefined, tags: nextTags, status: nextStatus, updatedAt: a.now });
    await appendActivity(ctx, { eventType: "task_blocker_resolved", entityType: "task", entityId: a.id, payload: JSON.stringify({ previousBlockerReason: task.blockerReason ?? null, resumedTo: nextStatus, taskId: a.id }), createdAt: a.now });
    return a.id;
  }
});

export const remove = mutation({
  args: { id: v.id("tasks"), now: v.string() },
  handler: async (ctx, a) => {
    const task = await ctx.db.get(a.id); if (!task) throw new Error("Task not found");
    await appendActivity(ctx, { eventType: "task_deleted", entityType: "task", entityId: a.id, payload: JSON.stringify({ title: task.title, taskId: a.id }), createdAt: a.now });
    await ctx.db.delete(a.id);
    return true;
  }
});

export const taskActivity = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, a) => ctx.db.query("activityEvents").withIndex("by_entity", (q) => q.eq("entityType", "task").eq("entityId", a.taskId)).collect()
});
