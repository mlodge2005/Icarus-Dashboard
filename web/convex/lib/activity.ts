import { MutationCtx } from "./types";

export const summaryFor = (eventType: string, payload: string) => {
  const p = JSON.parse(payload) as Record<string, string>;
  switch (eventType) {
    case "task_created": return `Task created: ${p.title ?? "untitled"}`;
    case "task_updated": return `Task updated: ${p.title ?? p.taskId ?? "task"}`;
    case "task_status_changed": return `Task moved ${p.from ?? "?"} → ${p.to ?? "?"}`;
    case "project_created": return `Project created: ${p.name ?? "project"}`;
    case "content_created": return `Content created: ${p.title ?? "item"}`;
    case "document_attached": return `Document attached to task ${p.taskId ?? ""}`;
    case "activity_appended": return `Activity appended for ${p.entityType ?? "entity"}`;
    default: return `Activity: ${eventType}`;
  }
};

export async function appendActivity(ctx: MutationCtx, args: { eventType: string; entityType: string; entityId: string; payload: string; createdAt: string; }) {
  await ctx.db.insert("activityEvents", { ...args, summary: summaryFor(args.eventType, args.payload) });
}
