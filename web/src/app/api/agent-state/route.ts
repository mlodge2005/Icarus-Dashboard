import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

function oneLine(input: unknown, fallback: string) {
  const s = String(input ?? "").replace(/\s+/g, " ").trim();
  return (s || fallback).slice(0, 280);
}

export async function POST(req: NextRequest) {
  try {
    const expected = process.env.AGENT_STATE_API_KEY;
    if (!expected) return NextResponse.json({ ok: false, error: "AGENT_STATE_API_KEY missing" }, { status: 500 });
    const provided = req.headers.get("x-api-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    if (provided !== expected) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) return NextResponse.json({ ok: false, error: "NEXT_PUBLIC_CONVEX_URL missing" }, { status: 500 });

    const body = await req.json().catch(()=>({}));
    const now = new Date().toISOString();
    const promptSummary = oneLine(body.prompt ?? body.message ?? body.event ?? "Agent state event", "Agent state event");
    const actionSummary = oneLine(body.state ?? body.status ?? body.detail ?? JSON.stringify(body).slice(0,200), "State updated");

    const convex = new ConvexHttpClient(convexUrl);
    await convex.mutation("promptLogs:append" as any, { promptSummary, actionSummary, source: "agent-state-publisher", now });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
