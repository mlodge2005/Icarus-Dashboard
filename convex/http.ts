import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { z } from "zod";
import { ok, err } from "./lib/response";

const router = httpRouter();
const mustAuth = (req: Request) => {
  const k = process.env.AGENT_KEY;
  if (!k) return false;
  return req.headers.get("authorization") === `Bearer ${k}`;
};
const iso = z.string().datetime({ offset: true });

const send = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

router.route({ path: "/api/agent/listTasks", method: "POST", handler: httpAction(async (ctx, req) => {
  if (!mustAuth(req)) return send(err("UNAUTHORIZED", "Unauthorized"), 401);
  const data = await ctx.runQuery(api.tasks.list, {});
  return send(ok(data));
})});

router.route({ path: "/api/agent/createTask", method: "POST", handler: httpAction(async (ctx, req) => {
  if (!mustAuth(req)) return send(err("UNAUTHORIZED", "Unauthorized"), 401);
  const schema = z.object({ title: z.string().min(1), description: z.string().optional(), status: z.enum(["todo","in_progress","done"]), priority: z.enum(["low","medium","high"]), dueDate: iso.optional(), tags: z.array(z.string()), projectId: z.string().optional(), externalLinks: z.array(z.string()) }).strict();
  const parsed = schema.safeParse(await req.json()); if (!parsed.success) return send(err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid payload"), 400);
  const id = await ctx.runMutation(api.tasks.create, { ...parsed.data, projectId: undefined, now: new Date().toISOString() });
  return send(ok({ id }));
})});

router.route({ path: "/api/agent/updateTask", method: "POST", handler: httpAction(async (ctx, req) => {
  if (!mustAuth(req)) return send(err("UNAUTHORIZED", "Unauthorized"), 401);
  const schema = z.object({ id: z.string(), title: z.string().optional(), description: z.string().optional(), priority: z.enum(["low","medium","high"]).optional(), dueDate: iso.optional(), tags: z.array(z.string()).optional(), externalLinks: z.array(z.string()).optional() }).strict();
  const p = schema.safeParse(await req.json()); if (!p.success) return send(err("VALIDATION_ERROR", "Invalid payload"), 400);
  const id = await ctx.runMutation(api.tasks.update, { ...p.data, id: p.data.id as never, now: new Date().toISOString() });
  return send(ok({ id }));
})});

router.route({ path: "/api/agent/moveTaskStatus", method: "POST", handler: httpAction(async (ctx, req) => {
  if (!mustAuth(req)) return send(err("UNAUTHORIZED", "Unauthorized"), 401);
  const schema = z.object({ id: z.string(), to: z.enum(["todo","in_progress","done"]) }).strict();
  const p = schema.safeParse(await req.json()); if (!p.success) return send(err("VALIDATION_ERROR", "Invalid payload"), 400);
  const id = await ctx.runMutation(api.tasks.moveStatus, { id: p.data.id as never, to: p.data.to, now: new Date().toISOString() });
  return send(ok({ id }));
})});

router.route({ path: "/api/agent/createContentIdea", method: "POST", handler: httpAction(async (ctx, req) => {
  if (!mustAuth(req)) return send(err("UNAUTHORIZED", "Unauthorized"), 401);
  const schema = z.object({ title: z.string(), platform: z.string(), hook: z.string(), status: z.enum(["ideas","drafts","published"]), link: z.string().optional(), tags: z.array(z.string()) }).strict();
  const p = schema.safeParse(await req.json()); if (!p.success) return send(err("VALIDATION_ERROR", "Invalid payload"), 400);
  const id = await ctx.runMutation(api.content.create, { ...p.data, now: new Date().toISOString() });
  return send(ok({ id }));
})});

router.route({ path: "/api/agent/updateContentItem", method: "POST", handler: httpAction(async (ctx, req) => {
  if (!mustAuth(req)) return send(err("UNAUTHORIZED", "Unauthorized"), 401);
  const schema = z.object({ id: z.string(), title: z.string().optional(), platform: z.string().optional(), hook: z.string().optional(), status: z.enum(["ideas","drafts","published"]).optional(), link: z.string().optional(), tags: z.array(z.string()).optional() }).strict();
  const p = schema.safeParse(await req.json()); if (!p.success) return send(err("VALIDATION_ERROR", "Invalid payload"), 400);
  const id = await ctx.runMutation(api.content.update, { ...p.data, id: p.data.id as never, now: new Date().toISOString() });
  return send(ok({ id }));
})});

router.route({ path: "/api/agent/createDocumentLink", method: "POST", handler: httpAction(async (ctx, req) => {
  if (!mustAuth(req)) return send(err("UNAUTHORIZED", "Unauthorized"), 401);
  const schema = z.object({ title: z.string(), url: z.string().optional(), note: z.string().optional() }).strict();
  const p = schema.safeParse(await req.json()); if (!p.success) return send(err("VALIDATION_ERROR", "Invalid payload"), 400);
  const id = await ctx.runMutation(api.documents.create, { ...p.data, now: new Date().toISOString() });
  return send(ok({ id }));
})});

router.route({ path: "/api/agent/attachDocumentToTask", method: "POST", handler: httpAction(async (ctx, req) => {
  if (!mustAuth(req)) return send(err("UNAUTHORIZED", "Unauthorized"), 401);
  const schema = z.object({ taskId: z.string(), documentId: z.string() }).strict();
  const p = schema.safeParse(await req.json()); if (!p.success) return send(err("VALIDATION_ERROR", "Invalid payload"), 400);
  await ctx.runMutation(api.documents.attachToTask, { taskId: p.data.taskId as never, documentId: p.data.documentId as never, now: new Date().toISOString() });
  return send(ok({ attached: true }));
})});

router.route({ path: "/api/agent/appendActivityEvent", method: "POST", handler: httpAction(async (ctx, req) => {
  if (!mustAuth(req)) return send(err("UNAUTHORIZED", "Unauthorized"), 401);
  const schema = z.object({ eventType: z.string(), entityType: z.string(), entityId: z.string(), payload: z.record(z.any()) }).strict();
  const p = schema.safeParse(await req.json()); if (!p.success) return send(err("VALIDATION_ERROR", "Invalid payload"), 400);
  await ctx.runMutation(api.activity.append, { eventType: p.data.eventType, entityType: p.data.entityType, entityId: p.data.entityId, payload: JSON.stringify(p.data.payload), now: new Date().toISOString() });
  return send(ok({ appended: true }));
})});

export default router;
