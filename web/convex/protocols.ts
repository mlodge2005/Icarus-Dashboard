import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity } from "./lib/activity";

export const list = query({ args: {}, handler: async (ctx) => ctx.db.query("protocols").collect() });

export const create = mutation({
  args: { name: v.string(), trigger: v.union(v.literal("manual"), v.literal("schedule"), v.literal("event")), objective: v.string(), steps: v.array(v.string()), approvalsRequired: v.boolean(), now: v.string() },
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
      const id = await ctx.db.insert("protocols", { name: t.name, trigger: "manual", objective: t.objective, steps: t.steps, approvalsRequired: true, active: true, createdAt: a.now, updatedAt: a.now });
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

    const runId = await ctx.db.insert("protocolRuns", { protocolId: a.protocolId, status: "queued", startedAt: a.now, output: `Queued protocol: ${protocol.name}` });

    if (protocol.approvalsRequired && !a.approvalGranted) {
      await ctx.db.patch(runId, { status: "failed", endedAt: a.now, error: "Approval required before execution." });
      await appendActivity(ctx, { eventType: "protocol_run_blocked", entityType: "protocol", entityId: a.protocolId, payload: JSON.stringify({ protocolId: a.protocolId, reason: "approval_required", runId }), createdAt: a.now });
      return runId;
    }

    await ctx.db.patch(runId, { status: "running", output: `Running protocol: ${protocol.name}` });
    await appendActivity(ctx, { eventType: "protocol_run_started", entityType: "protocol", entityId: a.protocolId, payload: JSON.stringify({ protocolId: a.protocolId, runId }), createdAt: a.now });

    for (let i = 0; i < protocol.steps.length; i++) {
      const stepText = protocol.steps[i] ?? "";
      const stepId = await ctx.db.insert("protocolRunSteps", { runId, stepIndex: i, stepText, status: "running", startedAt: new Date().toISOString() });
      await ctx.db.patch(stepId, { status: "success", endedAt: new Date().toISOString() });
    }

    await ctx.db.patch(runId, { status: "success", endedAt: new Date().toISOString(), output: `Executed ${protocol.steps.length} steps.` });
    await appendActivity(ctx, { eventType: "protocol_run_completed", entityType: "protocol", entityId: a.protocolId, payload: JSON.stringify({ protocolId: a.protocolId, runId, status: "success" }), createdAt: new Date().toISOString() });
    return runId;
  },
});

export const listRuns = query({ args: {}, handler: async (ctx) => (await ctx.db.query("protocolRuns").collect()).sort((a, b) => b.startedAt.localeCompare(a.startedAt)) });
export const runSteps = query({ args: { runId: v.id("protocolRuns") }, handler: async (ctx, a) => (await ctx.db.query("protocolRunSteps").withIndex("by_run", (q) => q.eq("runId", a.runId)).collect()).sort((x, y) => x.stepIndex - y.stepIndex) });
