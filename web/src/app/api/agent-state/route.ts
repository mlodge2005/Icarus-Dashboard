import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

function oneLine(input: unknown, fallback: string) {
  const s = String(input ?? "").replace(/\s+/g, " ").trim();
  return (s || fallback).slice(0, 280);
}

function normalizeState(body: any): "processing" | "idle" | "unknown" {
  const raw = String(body.state ?? body.status ?? body.phase ?? body.event ?? "").toLowerCase();
  if (["processing", "busy", "running", "thinking", "responding", "in_progress", "prompt"].some((k) => raw.includes(k))) return "processing";
  if (["idle", "done", "completed", "success", "response", "stopped", "ready"].some((k) => raw.includes(k))) return "idle";
  return "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const expectedKeys = [process.env.AGENT_STATE_API_KEY, process.env.PROMPT_LOG_HOOK_SECRET].filter(Boolean) as string[];
    if (expectedKeys.length === 0) return NextResponse.json({ ok: false, error: "AGENT_STATE_API_KEY missing" }, { status: 500 });
    const provided = req.headers.get("x-api-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    if (!expectedKeys.includes(provided)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) return NextResponse.json({ ok: false, error: "NEXT_PUBLIC_CONVEX_URL missing" }, { status: 500 });

    const body = await req.json().catch(()=>({}));
    const now = new Date().toISOString();
    const promptSummary = oneLine(body.prompt ?? body.message ?? body.event ?? "Agent state event", "Agent state event");
    const actionSummary = oneLine(body.state ?? body.status ?? body.detail ?? JSON.stringify(body).slice(0,200), "State updated");

    const convex = new ConvexHttpClient(convexUrl);
    await convex.mutation("promptLogs:append" as any, { promptSummary, actionSummary, source: "agent-state-publisher", now });

    const normalized = normalizeState(body);
    if (normalized === "processing") {
      await convex.mutation("runtime:setProcessing" as any, { processing: true, reason: "agent_state_processing", now, timeoutSeconds: 600 });
    } else if (normalized === "idle") {
      await convex.mutation("runtime:setProcessing" as any, { processing: false, reason: "agent_state_idle", now });
    }

    return NextResponse.json({ ok: true, normalized });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
