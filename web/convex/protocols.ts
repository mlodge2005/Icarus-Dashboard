import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity } from "./lib/activity";

export const list = query({ args: {}, handler: async (ctx) => ctx.db.query("protocols").collect() });

async function executeProtocolRun(ctx: any, opts: { protocol: any; protocolId: any; now: string; approvalGranted?: boolean; providedInputs?: string[]; source?: "manual" | "scheduled" }) {
  const { protocol, protocolId, now, approvalGranted, providedInputs } = opts;
  const runId = await ctx.db.insert("protocolRuns", { protocolId, status: "queued", startedAt: now, output: `Queued protocol: ${protocol.name}` });

  const provided = new Set((providedInputs ?? []).map((x) => x.trim()).filter(Boolean));
  const missingInputs = (protocol.allowNoInput ? [] : (protocol.requiredInputs ?? []).filter((req: string) => !provided.has(req)));
  if (missingInputs.length > 0) {
    await ctx.db.patch(runId, { status: "failed", endedAt: now, error: `Missing required inputs: ${missingInputs.join(", ")}` });
    await appendActivity(ctx, { eventType: "protocol_run_blocked", entityType: "protocol", entityId: protocolId, payload: JSON.stringify({ protocolId, reason: "missing_inputs", missingInputs, runId }), createdAt: now });
    return runId;
  }

  if (protocol.approvalsRequired && !approvalGranted) {
    await ctx.db.patch(runId, { status: "failed", endedAt: now, error: "Approval required before execution." });
    await appendActivity(ctx, { eventType: "protocol_run_blocked", entityType: "protocol", entityId: protocolId, payload: JSON.stringify({ protocolId, reason: "approval_required", runId }), createdAt: now });
    return runId;
  }

  await ctx.db.patch(runId, { status: "running", output: `Running protocol: ${protocol.name}` });
  await appendActivity(ctx, { eventType: "protocol_run_started", entityType: "protocol", entityId: protocolId, payload: JSON.stringify({ protocolId, runId, source: opts.source ?? "manual" }), createdAt: now });

  for (let i = 0; i < protocol.steps.length; i++) {
    const stepText = protocol.steps[i] ?? "";
    const stepId = await ctx.db.insert("protocolRunSteps", { runId, stepIndex: i, stepText, status: "running", startedAt: new Date().toISOString() });
    await ctx.db.patch(stepId, { status: "success", endedAt: new Date().toISOString() });
  }

  await ctx.db.patch(runId, { status: "success", endedAt: new Date().toISOString(), output: `Executed ${protocol.steps.length} steps. DoD: ${protocol.definitionOfDone ?? "n/a"}` });
  await appendActivity(ctx, { eventType: "protocol_run_completed", entityType: "protocol", entityId: protocolId, payload: JSON.stringify({ protocolId, runId, status: "success", source: opts.source ?? "manual" }), createdAt: new Date().toISOString() });
  return runId;
}

export const create = mutation({
  args: { name: v.string(), trigger: v.union(v.literal("manual"), v.literal("schedule"), v.literal("event")), objective: v.string(), definitionOfDone: v.optional(v.string()), requiredInputs: v.array(v.string()), steps: v.array(v.string()), approvalsRequired: v.boolean(), allowNoInput: v.optional(v.boolean()), scheduleEnabled: v.optional(v.boolean()), scheduleIntervalMinutes: v.optional(v.number()), templateCategory: v.optional(v.string()), now: v.string() },
  handler: async (ctx, a) => {
    const id = await ctx.db.insert("protocols", { name: a.name, trigger: a.trigger, objective: a.objective, definitionOfDone: a.definitionOfDone, requiredInputs: a.requiredInputs, steps: a.steps, approvalsRequired: a.approvalsRequired, allowNoInput: a.allowNoInput ?? false, scheduleEnabled: a.scheduleEnabled ?? false, scheduleIntervalMinutes: a.scheduleIntervalMinutes, templateCategory: a.templateCategory, active: true, createdAt: a.now, updatedAt: a.now });
    await appendActivity(ctx, { eventType: "protocol_created", entityType: "protocol", entityId: id, payload: JSON.stringify({ name: a.name }), createdAt: a.now });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("protocols"),
    name: v.optional(v.string()),
    objective: v.optional(v.string()),
    definitionOfDone: v.optional(v.string()),
    requiredInputs: v.optional(v.array(v.string())),
    steps: v.optional(v.array(v.string())),
    approvalsRequired: v.optional(v.boolean()),
    allowNoInput: v.optional(v.boolean()),
    trigger: v.optional(v.union(v.literal("manual"), v.literal("schedule"), v.literal("event"))),
    scheduleEnabled: v.optional(v.boolean()),
    scheduleIntervalMinutes: v.optional(v.number()),
    now: v.string(),
  },
  handler: async (ctx, a) => {
    const p = await ctx.db.get(a.id); if (!p) throw new Error("Protocol not found");
    const patch = {
      name: a.name ?? p.name,
      objective: a.objective ?? p.objective,
      definitionOfDone: a.definitionOfDone ?? p.definitionOfDone,
      requiredInputs: a.requiredInputs ?? p.requiredInputs,
      steps: a.steps ?? p.steps,
      approvalsRequired: a.approvalsRequired ?? p.approvalsRequired,
      allowNoInput: a.allowNoInput ?? p.allowNoInput ?? false,
      trigger: a.trigger ?? p.trigger,
      scheduleEnabled: a.scheduleEnabled ?? p.scheduleEnabled ?? false,
      scheduleIntervalMinutes: a.scheduleIntervalMinutes ?? p.scheduleIntervalMinutes,
      updatedAt: a.now,
    };
    await ctx.db.patch(a.id, patch);
    await appendActivity(ctx, { eventType: "protocol_updated", entityType: "protocol", entityId: a.id, payload: JSON.stringify({ protocolId: a.id }), createdAt: a.now });
    return a.id;
  },
});

export const setActive = mutation({
  args: { id: v.id("protocols"), active: v.boolean(), now: v.string() },
  handler: async (ctx, a) => {
    const p = await ctx.db.get(a.id); if (!p) throw new Error("Protocol not found");
    await ctx.db.patch(a.id, { active: a.active, updatedAt: a.now });
    await appendActivity(ctx, { eventType: a.active ? "protocol_resumed" : "protocol_paused", entityType: "protocol", entityId: a.id, payload: JSON.stringify({ protocolId: a.id, active: a.active }), createdAt: a.now });
    return a.id;
  },
});

export const remove = mutation({
  args: { id: v.id("protocols"), now: v.string() },
  handler: async (ctx, a) => {
    const p = await ctx.db.get(a.id); if (!p) throw new Error("Protocol not found");
    await appendActivity(ctx, { eventType: "protocol_deleted", entityType: "protocol", entityId: a.id, payload: JSON.stringify({ name: p.name, protocolId: a.id }), createdAt: a.now });
    await ctx.db.delete(a.id);
    return true;
  },
});

export const createTemplateSet = mutation({
  args: { now: v.string() },
  handler: async (ctx, a) => {
    const templates = [
      { name: "Daily Ops Triage", category: "operations", objective: "Review Now/Next/Blocked and post an action summary.", definitionOfDone: "Updated priorities and clear next actions posted.", requiredInputs: ["Current task board", "Inbox access"], steps: ["Review Now", "Review Next", "Identify blockers", "Send summary"] },
      { name: "Release Readiness", category: "delivery", objective: "Validate build, blockers, and deployment readiness.", definitionOfDone: "Go/no-go decision documented with blockers.", requiredInputs: ["Repo access", "Build environment", "Deploy checklist"], steps: ["Run build", "Check blockers", "Confirm env", "Ship decision"] },
      { name: "Inbox Escalation Sweep", category: "communications", objective: "Find urgent messages and route decisions.", definitionOfDone: "Urgent items triaged with owners and deadlines.", requiredInputs: ["Inbox access", "Priority rules"], steps: ["Check inbox", "Tag urgent", "Draft replies", "Escalate blockers"] },
    ];

    const ids: string[] = [];
    for (const t of templates) {
      const id = await ctx.db.insert("protocols", { name: t.name, trigger: "manual", objective: t.objective, definitionOfDone: t.definitionOfDone, requiredInputs: t.requiredInputs, steps: t.steps, approvalsRequired: true, allowNoInput: false, scheduleEnabled: false, templateCategory: t.category, active: true, createdAt: a.now, updatedAt: a.now });
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
    if (!protocol.active) throw new Error("Protocol is paused");
    return await executeProtocolRun(ctx, { protocol, protocolId: a.protocolId, now: a.now, approvalGranted: a.approvalGranted, providedInputs: a.providedInputs, source: "manual" });
  },
});

export const runDueSchedules = mutation({
  args: { now: v.string() },
  handler: async (ctx, a) => {
    const protocols = await ctx.db.query("protocols").collect();
    const nowMs = new Date(a.now).getTime();
    const executed: string[] = [];

    for (const p of protocols) {
      if (!p.active || p.trigger !== "schedule" || !p.scheduleEnabled || !p.scheduleIntervalMinutes || p.scheduleIntervalMinutes <= 0) continue;
      const last = p.lastScheduledRunAt ? new Date(p.lastScheduledRunAt).getTime() : 0;
      const due = !last || (nowMs - last) >= p.scheduleIntervalMinutes * 60_000;
      if (!due) continue;
      if (p.approvalsRequired) {
        await appendActivity(ctx, { eventType: "protocol_schedule_skipped", entityType: "protocol", entityId: p._id, payload: JSON.stringify({ protocolId: p._id, reason: "approval_required" }), createdAt: a.now });
        continue;
      }
      await executeProtocolRun(ctx, { protocol: p, protocolId: p._id, now: a.now, approvalGranted: true, providedInputs: [], source: "scheduled" });
      await ctx.db.patch(p._id, { lastScheduledRunAt: a.now, updatedAt: a.now });
      executed.push(p._id);
    }

    return { executedCount: executed.length, executed };
  },
});

export const listRuns = query({ args: {}, handler: async (ctx) => (await ctx.db.query("protocolRuns").collect()).sort((a, b) => b.startedAt.localeCompare(a.startedAt)) });
export const runSteps = query({ args: { runId: v.id("protocolRuns") }, handler: async (ctx, a) => (await ctx.db.query("protocolRunSteps").withIndex("by_run", (q) => q.eq("runId", a.runId)).collect()).sort((x, y) => x.stepIndex - y.stepIndex) });
export const analytics = query({ args: {}, handler: async (ctx) => { const runs = await ctx.db.query("protocolRuns").collect(); const total = runs.length; const success = runs.filter((r) => r.status === "success").length; const failed = runs.filter((r) => r.status === "failed").length; const successRate = total > 0 ? Math.round((success / total) * 100) : 0; const byProtocol = new Map<string, { total: number; success: number; failed: number }>(); for (const run of runs) { const cur = byProtocol.get(run.protocolId) ?? { total: 0, success: 0, failed: 0 }; cur.total += 1; if (run.status === "success") cur.success += 1; if (run.status === "failed") cur.failed += 1; byProtocol.set(run.protocolId, cur); } return { totals: { total, success, failed, successRate }, byProtocol: Array.from(byProtocol.entries()).map(([protocolId, v]) => ({ protocolId, ...v })) }; } });
