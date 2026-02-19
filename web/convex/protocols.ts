import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity } from "./lib/activity";

export const list = query({ args: {}, handler: async (ctx) => ctx.db.query("protocols").collect() });

export const create = mutation({
  args: {
    name: v.string(),
    trigger: v.union(v.literal("manual"), v.literal("schedule"), v.literal("event")),
    objective: v.string(),
    definitionOfDone: v.optional(v.string()),
    requiredInputs: v.array(v.string()),
    steps: v.array(v.string()),
    approvalsRequired: v.boolean(),
    templateCategory: v.optional(v.string()),
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
      {
        name: "Daily Ops Triage",
        category: "operations",
        objective: "Review Now/Next/Blocked and post an action summary.",
        definitionOfDone: "Updated priorities and clear next actions posted.",
        requiredInputs: ["Current task board", "Inbox access"],
        steps: ["Review Now", "Review Next", "Identify blockers", "Send summary"],
      },
      {
        name: "Release Readiness",
        category: "delivery",
        objective: "Validate build, blockers, and deployment readiness.",
        definitionOfDone: "Go/no-go decision documented with blockers.",
        requiredInputs: ["Repo access", "Build environment", "Deploy checklist"],
        steps: ["Run build", "Check blockers", "Confirm env", "Ship decision"],
      },
      {
        name: "Inbox Escalation Sweep",
        category: "communications",
        objective: "Find urgent messages and route decisions.",
        definitionOfDone: "Urgent items triaged with owners and deadlines.",
        requiredInputs: ["Inbox access", "Priority rules"],
        steps: ["Check inbox", "Tag urgent", "Draft replies", "Escalate blockers"],
      },
    ];

    const ids: string[] = [];
    for (const t of templates) {
      const id = await ctx.db.insert("protocols", {
        name: t.name,
        trigger: "manual",
        objective: t.objective,
        definitionOfDone: t.definitionOfDone,
        requiredInputs: t.requiredInputs,
        steps: t.steps,
        approvalsRequired: true,
        templateCategory: t.category,
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
  args: { protocolId: v.id("protocols"), now: v.string(), approvalGranted: v.optional(v.boolean()), providedInputs: v.optional(v.array(v.string())) },
  handler: async (ctx, a) => {
    const protocol = await ctx.db.get(a.protocolId);
    if (!protocol) throw new Error("Protocol not found");

    const runId = await ctx.db.insert("protocolRuns", { protocolId: a.protocolId, status: "queued", startedAt: a.now, output: `Queued protocol: ${protocol.name}` });

    const provided = new Set((a.providedInputs ?? []).map((x) => x.trim()).filter(Boolean));
    const missingInputs = (protocol.requiredInputs ?? []).filter((req) => !provided.has(req));
    if (missingInputs.length > 0) {
      await ctx.db.patch(runId, { status: "failed", endedAt: a.now, error: `Missing required inputs: ${missingInputs.join(", ")}` });
      await appendActivity(ctx, { eventType: "protocol_run_blocked", entityType: "protocol", entityId: a.protocolId, payload: JSON.stringify({ protocolId: a.protocolId, reason: "missing_inputs", missingInputs, runId }), createdAt: a.now });
      return runId;
    }

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

    await ctx.db.patch(runId, { status: "success", endedAt: new Date().toISOString(), output: `Executed ${protocol.steps.length} steps. DoD: ${protocol.definitionOfDone ?? "n/a"}` });
    await appendActivity(ctx, { eventType: "protocol_run_completed", entityType: "protocol", entityId: a.protocolId, payload: JSON.stringify({ protocolId: a.protocolId, runId, status: "success" }), createdAt: new Date().toISOString() });
    return runId;
  },
});

export const listRuns = query({ args: {}, handler: async (ctx) => (await ctx.db.query("protocolRuns").collect()).sort((a, b) => b.startedAt.localeCompare(a.startedAt)) });
export const runSteps = query({ args: { runId: v.id("protocolRuns") }, handler: async (ctx, a) => (await ctx.db.query("protocolRunSteps").withIndex("by_run", (q) => q.eq("runId", a.runId)).collect()).sort((x, y) => x.stepIndex - y.stepIndex) });

export const analytics = query({
  args: {},
  handler: async (ctx) => {
    const runs = await ctx.db.query("protocolRuns").collect();
    const total = runs.length;
    const success = runs.filter((r) => r.status === "success").length;
    const failed = runs.filter((r) => r.status === "failed").length;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

    const byProtocol = new Map<string, { total: number; success: number; failed: number }>();
    for (const run of runs) {
      const cur = byProtocol.get(run.protocolId) ?? { total: 0, success: 0, failed: 0 };
      cur.total += 1;
      if (run.status === "success") cur.success += 1;
      if (run.status === "failed") cur.failed += 1;
      byProtocol.set(run.protocolId, cur);
    }

    return {
      totals: { total, success, failed, successRate },
      byProtocol: Array.from(byProtocol.entries()).map(([protocolId, v]) => ({ protocolId, ...v })),
    };
  },
});
