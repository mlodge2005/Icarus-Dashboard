import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

function oneLine(input: unknown, fallback: string) {
  const s = String(input ?? "").replace(/\s+/g, " ").trim();
  if (!s) return fallback;
  return s.slice(0, 280);
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.PROMPT_LOG_HOOK_SECRET;
    if (!secret) return NextResponse.json({ ok: false, error: "PROMPT_LOG_HOOK_SECRET is not configured" }, { status: 500 });

    const auth = req.headers.get("authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (token !== secret) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) return NextResponse.json({ ok: false, error: "NEXT_PUBLIC_CONVEX_URL missing" }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const promptSummary = oneLine(body.promptSummary ?? body.prompt ?? body.userMessage, "No prompt summary provided");
    const actionSummary = oneLine(body.actionSummary ?? body.action ?? body.responseSummary ?? body.assistantMessage, "No action summary provided");
    const source = oneLine(body.source ?? "hook", "hook");
    const now = typeof body.now === "string" && body.now ? body.now : new Date().toISOString();
    const phase = oneLine(body.phase ?? "", "");

    const convex = new ConvexHttpClient(convexUrl);
    await convex.mutation("promptLogs:append" as any, { promptSummary, actionSummary, source, now });

    if (phase === "prompt") {
      await convex.mutation("runtime:setProcessing" as any, { processing: true, reason: "prompt_received", now, timeoutSeconds: 300 });
    } else if (phase === "response") {
      await convex.mutation("runtime:setProcessing" as any, { processing: false, reason: "response_sent", now });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
