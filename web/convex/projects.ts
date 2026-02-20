import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity } from "./lib/activity";

const blockerReason = v.union(v.literal("missing_credential"), v.literal("needs_approval"), v.literal("dependency_down"), v.literal("ambiguous_input"), v.literal("other"));

async function getActiveProject(ctx: any) {
  const rows = await ctx.db.query("projects").collect();
  return rows.find((p:any)=>p.status === "active") ?? null;
}

function parseSpecsToSteps(specs?: string) {
  if (!specs) return [] as string[];
  return specs
    .split("\n")
    .map((s) => s.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

export const list = query({ args: {}, handler: async (ctx) => ctx.db.query("projects").collect() });
export const listQueue = query({ args: {}, handler: async (ctx) => (await ctx.db.query("projects").collect()).filter((p:any)=>(p.status ?? "inactive")==="queued").sort((a:any,b:any)=>(a.queuePosition??999)-(b.queuePosition??999)) });
export const getExecutionState = query({ args: {}, handler: async (ctx) => (await ctx.db.query("executionState").collect())[0] ?? { mode: "running", updatedAt: new Date().toISOString() } });
export const stepsByProject = query({ args: { projectId: v.id("projects") }, handler: async (ctx, a) => (await ctx.db.query("projectSteps").withIndex("by_project", (q) => q.eq("projectId", a.projectId)).collect()).sort((x:any,y:any)=>x.stepIndex-y.stepIndex) });

export const create = mutation({
  args: { name: v.string(), description: v.optional(v.string()), outcome: v.optional(v.string()), specs: v.optional(v.string()), definitionOfDone: v.optional(v.string()), now: v.string() },
  handler: async (ctx, a) => {
    const id = await ctx.db.insert("projects", { name: a.name, description: a.description, outcome: a.outcome, specs: a.specs, definitionOfDone: a.definitionOfDone, status: "inactive", createdAt: a.now, updatedAt: a.now });
    await appendActivity(ctx, { eventType: "project_created", entityType: "project", entityId: id, payload: JSON.stringify({ name: a.name }), createdAt: a.now });
    return id;
  }
});

export const update = mutation({
  args: { id: v.id("projects"), name: v.optional(v.string()), description: v.optional(v.string()), outcome: v.optional(v.string()), specs: v.optional(v.string()), definitionOfDone: v.optional(v.string()), nextAction: v.optional(v.string()), now: v.string() },
  handler: async (ctx, a) => {
    const p = await ctx.db.get(a.id); if (!p) throw new Error("Project not found");
    await ctx.db.patch(a.id, { name: a.name ?? p.name, description: a.description ?? p.description, outcome: a.outcome ?? p.outcome, specs: a.specs ?? p.specs, definitionOfDone: a.definitionOfDone ?? p.definitionOfDone, nextAction: a.nextAction ?? p.nextAction, updatedAt: a.now });
    await appendActivity(ctx, { eventType: "project_specs_updated", entityType: "project", entityId: a.id, payload: JSON.stringify({ projectId: a.id }), createdAt: a.now });
    return a.id;
  }
});

export const buildPlan = mutation({
  args: { id: v.id("projects"), now: v.string() },
  handler: async (ctx, a) => {
    const p = await ctx.db.get(a.id); if (!p) throw new Error("Project not found");
    const rawSteps = parseSpecsToSteps(p.specs);
    if (!rawSteps.length) throw new Error("Cannot build plan: specs are empty");

    const existing = await ctx.db.query("projectSteps").withIndex("by_project", (q) => q.eq("projectId", a.id)).collect();
    for (const s of existing) await ctx.db.delete(s._id);

    for (let i = 0; i < rawSteps.length; i++) {
      await ctx.db.insert("projectSteps", { projectId: a.id, stepIndex: i, text: rawSteps[i]!, status: "pending", updatedAt: a.now });
    }
    await ctx.db.patch(a.id, { nextAction: rawSteps[0], updatedAt: a.now });
    await appendActivity(ctx, { eventType: "project_plan_built", entityType: "project", entityId: a.id, payload: JSON.stringify({ stepCount: rawSteps.length }), createdAt: a.now });
    return rawSteps.length;
  }
});

export const runTick = mutation({
  args: { now: v.string() },
  handler: async (ctx, a) => {
    const modeRow = (await ctx.db.query("executionState").collect())[0];
    const mode = modeRow?.mode ?? "running";
    if (mode !== "running") throw new Error("Global mode is paused");

    const active = await getActiveProject(ctx);
    if (!active) throw new Error("No active project");

    let steps = await ctx.db.query("projectSteps").withIndex("by_project", (q) => q.eq("projectId", active._id)).collect();
    steps = steps.sort((x:any,y:any)=>x.stepIndex-y.stepIndex);

    if (!steps.length) {
      const parsed = parseSpecsToSteps(active.specs);
      if (!parsed.length) {
        await ctx.db.patch(active._id, { status: "blocked", blockerReason: "ambiguous_input", blockerDetails: "No executable specs were provided.", updatedAt: a.now });
        const row = (await ctx.db.query("executionState").collect())[0];
        if (row) await ctx.db.patch(row._id, { mode: "paused", updatedAt: a.now });
        await appendActivity(ctx, { eventType: "project_blocked", entityType: "project", entityId: active._id, payload: JSON.stringify({ reason: "ambiguous_input" }), createdAt: a.now });
        return "blocked";
      }
      for (let i = 0; i < parsed.length; i++) {
        await ctx.db.insert("projectSteps", { projectId: active._id, stepIndex: i, text: parsed[i]!, status: "pending", updatedAt: a.now });
      }
      steps = await ctx.db.query("projectSteps").withIndex("by_project", (q) => q.eq("projectId", active._id)).collect();
      steps = steps.sort((x:any,y:any)=>x.stepIndex-y.stepIndex);
    }

    const next = steps.find((s:any)=>s.status !== "done");
    if (!next) {
      await ctx.db.patch(active._id, { status: "inactive", queuePosition: undefined, nextAction: "Completed", updatedAt: a.now, lastExecutionAt: a.now });
      await appendActivity(ctx, { eventType: "project_completed", entityType: "project", entityId: active._id, payload: JSON.stringify({ projectId: active._id }), createdAt: a.now });
      return "completed";
    }

    await ctx.db.patch(next._id, { status: "running", updatedAt: a.now });
    await ctx.db.patch(next._id, { status: "done", updatedAt: a.now });

    const after = steps.filter((s:any)=>s._id !== next._id);
    const nextPending = after.find((s:any)=>s.status !== "done");
    await ctx.db.patch(active._id, { nextAction: nextPending ? nextPending.text : "Finalize project", updatedAt: a.now, lastExecutionAt: a.now });
    await appendActivity(ctx, { eventType: "project_tick_executed", entityType: "project", entityId: active._id, payload: JSON.stringify({ stepIndex: next.stepIndex, text: next.text }), createdAt: a.now });
    return "tick_ok";
  }
});

export const setMode = mutation({
  args: { mode: v.union(v.literal("running"), v.literal("paused")), now: v.string() },
  handler: async (ctx, a) => {
    const row = (await ctx.db.query("executionState").collect())[0];
    if (row) await ctx.db.patch(row._id, { mode: a.mode, updatedAt: a.now }); else await ctx.db.insert("executionState", { mode: a.mode, updatedAt: a.now });
    if (a.mode === "paused") {
      const active = await getActiveProject(ctx);
      if (active) {
        await ctx.db.patch(active._id, { status: "queued", updatedAt: a.now });
        await appendActivity(ctx, { eventType: "project_paused", entityType: "project", entityId: active._id, payload: JSON.stringify({ reason: "global_pause" }), createdAt: a.now });
      }
    }
    return true;
  }
});

export const enqueue = mutation({
  args: { id: v.id("projects"), now: v.string() },
  handler: async (ctx, a) => {
    const p = await ctx.db.get(a.id); if (!p) throw new Error("Project not found");
    const queued = (await ctx.db.query("projects").collect()).filter((x:any)=>(x.status ?? "inactive")==="queued");
    const nextPos = queued.length ? Math.max(...queued.map((q:any)=>q.queuePosition ?? 0)) + 1 : 1;
    await ctx.db.patch(a.id, { status: "queued", queuePosition: nextPos, blockerReason: undefined, blockerDetails: undefined, updatedAt: a.now });
    await appendActivity(ctx, { eventType: "project_queued", entityType: "project", entityId: a.id, payload: JSON.stringify({ queuePosition: nextPos }), createdAt: a.now });
    return a.id;
  }
});

export const activateNext = mutation({
  args: { now: v.string() },
  handler: async (ctx, a) => {
    const modeRow = (await ctx.db.query("executionState").collect())[0];
    const mode = modeRow?.mode ?? "running";
    if (mode !== "running") throw new Error("Global mode is paused");
    const active = await getActiveProject(ctx);
    if (active) throw new Error("A project is already active");
    const queued = (await ctx.db.query("projects").collect()).filter((x:any)=>(x.status ?? "inactive")==="queued").sort((x:any,y:any)=>(x.queuePosition??999)-(y.queuePosition??999));
    if (!queued.length) throw new Error("No queued projects");
    const next = queued[0];
    await ctx.db.patch(next._id, { status: "active", updatedAt: a.now, lastExecutionAt: a.now });
    await appendActivity(ctx, { eventType: "project_activated", entityType: "project", entityId: next._id, payload: JSON.stringify({ projectId: next._id }), createdAt: a.now });
    return next._id;
  }
});

export const setBlocked = mutation({
  args: { id: v.id("projects"), blockerReason, blockerDetails: v.optional(v.string()), now: v.string() },
  handler: async (ctx, a) => {
    const p = await ctx.db.get(a.id); if (!p) throw new Error("Project not found");
    await ctx.db.patch(a.id, { status: "blocked", blockerReason: a.blockerReason, blockerDetails: a.blockerDetails, updatedAt: a.now });
    const row = (await ctx.db.query("executionState").collect())[0];
    if (row) await ctx.db.patch(row._id, { mode: "paused", updatedAt: a.now }); else await ctx.db.insert("executionState", { mode: "paused", updatedAt: a.now });
    await appendActivity(ctx, { eventType: "project_blocked", entityType: "project", entityId: a.id, payload: JSON.stringify({ blockerReason: a.blockerReason, blockerDetails: a.blockerDetails ?? null }), createdAt: a.now });
    return a.id;
  }
});

export const resolveBlocked = mutation({
  args: { id: v.id("projects"), now: v.string() },
  handler: async (ctx, a) => {
    const p = await ctx.db.get(a.id); if (!p) throw new Error("Project not found");
    await ctx.db.patch(a.id, { status: "queued", blockerReason: undefined, blockerDetails: undefined, updatedAt: a.now });
    await appendActivity(ctx, { eventType: "project_unblocked", entityType: "project", entityId: a.id, payload: JSON.stringify({ projectId: a.id }), createdAt: a.now });
    return a.id;
  }
});

export const setInactive = mutation({
  args: { id: v.id("projects"), now: v.string() },
  handler: async (ctx, a) => {
    await ctx.db.patch(a.id, { status: "inactive", queuePosition: undefined, updatedAt: a.now });
    await appendActivity(ctx, { eventType: "project_deactivated", entityType: "project", entityId: a.id, payload: JSON.stringify({ projectId: a.id }), createdAt: a.now });
    return a.id;
  }
});

export const addArtifact = mutation({
  args: { projectId: v.id("projects"), fileName: v.string(), fileType: v.union(v.literal("text/plain"), v.literal("text/markdown"), v.literal("image/png")), dataUrl: v.string(), note: v.optional(v.string()), now: v.string() },
  handler: async (ctx, a) => {
    const lower = a.fileName.toLowerCase();
    const okExt = lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.png')
    if (!okExt) throw new Error("Unsupported file type. Allowed: .txt, .md, .png");
    const id = await ctx.db.insert("projectArtifacts", { projectId: a.projectId, fileName: a.fileName, fileType: a.fileType, dataUrl: a.dataUrl, note: a.note, createdAt: a.now });
    await appendActivity(ctx, { eventType: "project_artifact_added", entityType: "project", entityId: a.projectId, payload: JSON.stringify({ artifactId: id, fileName: a.fileName }), createdAt: a.now });
    return id;
  }
});

export const artifactsByProject = query({ args: { projectId: v.id("projects") }, handler: async (ctx, a) => ctx.db.query("projectArtifacts").withIndex("by_project", (q) => q.eq("projectId", a.projectId)).collect() });
