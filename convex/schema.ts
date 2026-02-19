import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const status = v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"));
const priority = v.union(v.literal("low"), v.literal("medium"), v.literal("high"));
const contentStatus = v.union(v.literal("ideas"), v.literal("drafts"), v.literal("published"));

export default defineSchema({
  projects: defineTable({ name: v.string(), description: v.optional(v.string()), createdAt: v.string(), updatedAt: v.string() }),
  tasks: defineTable({ title: v.string(), description: v.optional(v.string()), status, priority, dueDate: v.optional(v.string()), tags: v.array(v.string()), projectId: v.optional(v.id("projects")), externalLinks: v.array(v.string()), createdAt: v.string(), updatedAt: v.string() }).index("by_status", ["status"]).index("by_project", ["projectId"]),
  contentItems: defineTable({ title: v.string(), platform: v.string(), hook: v.string(), status: contentStatus, link: v.optional(v.string()), tags: v.array(v.string()), createdAt: v.string(), updatedAt: v.string() }).index("by_status", ["status"]),
  documents: defineTable({ title: v.string(), url: v.optional(v.string()), note: v.optional(v.string()), createdAt: v.string(), updatedAt: v.string() }),
  taskDocuments: defineTable({ taskId: v.id("tasks"), documentId: v.id("documents"), createdAt: v.string() }).index("by_task", ["taskId"]),
  activityEvents: defineTable({ eventType: v.string(), entityType: v.string(), entityId: v.string(), payload: v.string(), summary: v.string(), createdAt: v.string() }).index("by_entity", ["entityType", "entityId"])
});
