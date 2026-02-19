import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity } from "./lib/activity";

export const list = query({ args: {}, handler: async (ctx) => ctx.db.query("protocols").collect() });

export const create = mutation({
  args: {
    name: v.string(),
    trigger: v.union(v.literal("manual"), v.literal("schedule"), v.literal("event")),
    objective: v.string(),
    steps: v.array(v.string()),
    approvalsRequired: v.boolean(),
    now: v.string(),
  },
  handler: async (ctx, a) => {
    const id = await ctx.db.insert("protocols", { ...a, active: true, createdAt: a.now, updatedAt: a.now });
    await appendActivity(ctx, { eventType: "protocol_created", entityType: "protocol", entityId: id, payload: JSON.stringify({ name: a.name }), createdAt: a.now });
    return id;
  },
});

export const createTemplateSet = mutation({
  args: { now: v.string() },
  handler: async (ctx, a) => {
    const templates = [
      { name: "Daily Ops Triage", objective: "Review Now/Next/Blocked and post an action summary.", steps: ["Review Now", "Review Next", "Identify blockers", "Send summary"] },
      { name: "Release Readiness", objective: "Validate build, blockers, and deployment readiness.", steps: ["Run build", "Check blockers", "Confirm env", "Ship decision"] },
      { name: "Inbox Escalation Sweep", objective: "Find urgent messages and route decisions.", steps: ["Check inbox", "Tag urgent", "Draft replies", "Escalate blockers"] },
    ];

    const ids: string[] = [];
    for (const t of templates) {
      const id = await ctx.db.insert("protocols", {
        name: t.name,
        trigger: "manual",
        objective: t.objective,
        steps: t.steps,
        approvalsRequired: true,
        active: true,
        createdAt: a.now,
        updatedAt: a.now,
      });
      ids.push(id);
    }
    await appendActivity(ctx, { eventType: "protocol_templates_seeded", entityType: "protocol", entityId: "templates", payload: JSON.stringify({ count: ids.length }), createdAt: a.now });
    return ids;
  },
});

export const run = mutation({
  args: { protocolId: v.id("protocols"), now: v.string(), approvalGranted: v.optional(v.boolean()) },
  handler: async (ctx, a) => {
    const protocol = await ctx.db.get(a.protocolId);
    if (!protocol) throw new Error("Protocol not found");

    if (protocol.approvalsRequired && !a.approvalGranted) {
      const runId = await ctx.db.insert("protocolRuns", {
        protocolId: a.protocolId,
        status: "failed",
        startedAt: a.now,
        endedAt: a.now,
        error: "Approval required before execution.",
      });
      await appendActivity(ctx, {
        eventType: "protocol_run_blocked",
        entityType: "protocol",
        entityId: a.protocolId,
        payload: JSON.stringify({ protocolId: a.protocolId, reason: "approval_required" }),
        createdAt: a.now,
      });
      return runId;
    }

    const runId = await ctx.db.insert("protocolRuns", {
      protocolId: a.protocolId,
      status: "running",
      startedAt: a.now,
      output: `Started protocol: ${protocol.name}`,
    });

    await appendActivity(ctx, {
      eventType: "protocol_run_started",
      entityType: "protocol",
      entityId: a.protocolId,
      payload: JSON.stringify({ protocolId: a.protocolId, runId }),
      createdAt: a.now,
    });

    await ctx.db.patch(runId, {
      status: "success",
      endedAt: new Date().toISOString(),
      output: `Executed ${protocol.steps.length} steps (operator-run scaffold).`,
    });

    await appendActivity(ctx, {
      eventType: "protocol_run_completed",
      entityType: "protocol",
      entityId: a.protocolId,
      payload: JSON.stringify({ protocolId: a.protocolId, runId, status: "success" }),
      createdAt: new Date().toISOString(),
    });

    return runId;
  },
});

export const listRuns = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("protocolRuns").collect()).sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
});
