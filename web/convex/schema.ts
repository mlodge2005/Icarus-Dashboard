import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const status = v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"));
const priority = v.union(v.literal("low"), v.literal("medium"), v.literal("high"));
const contentStatus = v.union(v.literal("ideas"), v.literal("drafts"), v.literal("published"));
const capabilityStatus = v.union(v.literal("available"), v.literal("degraded"), v.literal("blocked"));
const protocolRunStatus = v.union(v.literal("queued"), v.literal("running"), v.literal("success"), v.literal("failed"));
const protocolStepStatus = v.union(v.literal("pending"), v.literal("running"), v.literal("success"), v.literal("failed"));
const blockerReason = v.union(v.literal("missing_credential"), v.literal("needs_approval"), v.literal("dependency_down"), v.literal("ambiguous_input"), v.literal("other"));
const projectStatus = v.union(v.literal("inactive"), v.literal("queued"), v.literal("active"), v.literal("blocked"));
const projectStepStatus = v.union(v.literal("pending"), v.literal("running"), v.literal("done"), v.literal("blocked"));

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    outcome: v.optional(v.string()),
    specs: v.optional(v.string()),
    definitionOfDone: v.optional(v.string()),
    status: v.optional(projectStatus),
    queuePosition: v.optional(v.number()),
    priority: v.optional(v.union(v.literal("low"), v.literal("med"), v.literal("high"), v.literal("critical"))),
    blockerReason: v.optional(blockerReason),
    blockerDetails: v.optional(v.string()),
    nextAction: v.optional(v.string()),
    lastExecutionAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_status", ["status"]).index("by_queue", ["queuePosition"]),
  executionState: defineTable({ mode: v.union(v.literal("running"), v.literal("paused")), updatedAt: v.string() }),

  runtimeMonitors: defineTable({
    key: v.string(),
    label: v.string(),
    medium: v.string(),
    target: v.string(),
    status: v.union(v.literal("online"), v.literal("offline"), v.literal("unknown")),
    details: v.optional(v.string()),
    lastCheckedAt: v.optional(v.string()),
    updatedAt: v.string(),
  }).index("by_key", ["key"]),
  projectArtifacts: defineTable({
    projectId: v.id("projects"),
    fileName: v.string(),
    fileType: v.union(v.literal("text/plain"), v.literal("text/markdown"), v.literal("image/png")),
    dataUrl: v.string(),
    note: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_project", ["projectId"]),
  projectSteps: defineTable({ projectId: v.id("projects"), stepIndex: v.number(), text: v.string(), status: projectStepStatus, updatedAt: v.string() }).index("by_project", ["projectId"]),

  tasks: defineTable({ title: v.string(), description: v.optional(v.string()), status, priority, dueDate: v.optional(v.string()), tags: v.array(v.string()), blockerReason: v.optional(blockerReason), projectId: v.optional(v.id("projects")), externalLinks: v.array(v.string()), createdAt: v.string(), updatedAt: v.string() }).index("by_status", ["status"]).index("by_project", ["projectId"]),
  contentItems: defineTable({ title: v.string(), platform: v.string(), hook: v.string(), status: contentStatus, link: v.optional(v.string()), tags: v.array(v.string()), createdAt: v.string(), updatedAt: v.string() }).index("by_status", ["status"]),
  documents: defineTable({ title: v.string(), url: v.optional(v.string()), note: v.optional(v.string()), createdAt: v.string(), updatedAt: v.string() }),
  taskDocuments: defineTable({ taskId: v.id("tasks"), documentId: v.id("documents"), createdAt: v.string() }).index("by_task", ["taskId"]),
  activityEvents: defineTable({ eventType: v.string(), entityType: v.string(), entityId: v.string(), payload: v.string(), summary: v.string(), createdAt: v.string() }).index("by_entity", ["entityType", "entityId"]),
  capabilities: defineTable({ name: v.string(), status: capabilityStatus, requirement: v.string(), lastCheckedAt: v.optional(v.string()), lastResult: v.optional(v.string()), fixHint: v.optional(v.string()), updatedAt: v.string() }).index("by_name", ["name"]),
  protocols: defineTable({ name: v.string(), trigger: v.union(v.literal("manual"), v.literal("schedule"), v.literal("event")), objective: v.string(), definitionOfDone: v.optional(v.string()), requiredInputs: v.array(v.string()), steps: v.array(v.string()), approvalsRequired: v.boolean(), templateCategory: v.optional(v.string()), active: v.boolean(), createdAt: v.string(), updatedAt: v.string() }).index("by_name", ["name"]).index("by_template_category", ["templateCategory"]),
  protocolRuns: defineTable({ protocolId: v.id("protocols"), status: protocolRunStatus, startedAt: v.string(), endedAt: v.optional(v.string()), output: v.optional(v.string()), error: v.optional(v.string()) }).index("by_protocol", ["protocolId"]),
  protocolRunSteps: defineTable({ runId: v.id("protocolRuns"), stepIndex: v.number(), stepText: v.string(), status: protocolStepStatus, startedAt: v.optional(v.string()), endedAt: v.optional(v.string()), error: v.optional(v.string()) }).index("by_run", ["runId"]),
});
