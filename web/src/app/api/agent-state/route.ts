import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MODES = new Set(["idle", "working", "waiting", "blocked", "subagent", "online", "error"]);

function parseSubagents(detail: string | null) {
  if (!detail) return 0;
  const m = detail.match(/subagents:(\d+)/i);
  return m ? Number(m[1]) : 0;
}

async function authorized(req: Request) {
  const session = await auth();
  if (session) return true;

  const key = req.headers.get("x-api-key") || "";
  const expected = process.env.DASH_API_KEY || "";
  return !!expected && key === expected;
}

export async function GET() {
  const bot = await prisma.bot.findFirst({ orderBy: { updatedAt: "desc" } });
  const detail = bot?.currentTaskId ?? null;

  return NextResponse.json({
    mode: bot?.status ?? "idle",
    detail,
    subagentsRunning: parseSubagents(detail),
    updatedAt: bot?.updatedAt?.toISOString() ?? null,
    lastHeartbeatAt: bot?.lastHeartbeatAt?.toISOString() ?? null,
  });
}

export async function POST(req: Request) {
  if (!(await authorized(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const mode = String(body?.mode || "").trim().toLowerCase();
  const detail = String(body?.detail || "").trim();
  const subagents = Number(body?.subagentsRunning ?? 0);

  if (!MODES.has(mode)) return NextResponse.json({ error: "invalid mode" }, { status: 400 });
  if (!Number.isFinite(subagents) || subagents < 0 || subagents > 100) {
    return NextResponse.json({ error: "invalid subagentsRunning" }, { status: 400 });
  }

  const detailWithSubs = `${detail || "—"} | subagents:${Math.trunc(subagents)}`;

  const bot = await prisma.bot.upsert({
    where: { id: "icarus-main" },
    create: {
      id: "icarus-main",
      name: "Icarus",
      status: mode,
      currentTaskId: detailWithSubs,
      lastHeartbeatAt: new Date(),
    },
    update: {
      status: mode,
      currentTaskId: detailWithSubs,
      lastHeartbeatAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, bot });
}
