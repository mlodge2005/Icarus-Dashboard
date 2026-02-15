import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const botId = String(body?.botId || "").trim();
  const status = String(body?.status || "").trim();
  const currentTaskId = body?.currentTaskId ? String(body.currentTaskId) : null;

  if (!botId || !["online", "idle", "error"].includes(status)) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const bot = await prisma.bot.upsert({
    where: { id: botId },
    create: {
      id: botId,
      name: "Icarus",
      status,
      lastHeartbeatAt: new Date(),
      currentTaskId,
    },
    update: {
      status,
      lastHeartbeatAt: new Date(),
      currentTaskId,
    },
  });

  return NextResponse.json({ ok: true, bot });
}
