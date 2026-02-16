import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const bot = await prisma.bot.findFirst({ orderBy: { updatedAt: "desc" } });

  const [todo, in_progress, blocked, done] = await Promise.all([
    prisma.task.count({ where: { status: "todo" } }),
    prisma.task.count({ where: { status: "in_progress" } }),
    prisma.task.count({ where: { status: "blocked" } }),
    prisma.task.count({ where: { status: "done" } }),
  ]);

  return NextResponse.json({
    bot,
    counts: { todo, in_progress, blocked, done },
  });
}
