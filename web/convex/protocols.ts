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

export const run = mutation({
  args: { protocolId: v.id("protocols"), now: v.string() },
  handler: async (ctx, a) => {
    const protocol = await ctx.db.get(a.protocolId);
    if (!protocol) throw new Error("Protocol not found");

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
      output: `Executed ${protocol.steps.length} steps (operator-run; placeholder executor).`,
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
