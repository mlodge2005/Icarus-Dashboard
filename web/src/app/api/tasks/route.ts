import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TaskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  status: z.enum(["todo", "in_progress", "blocked", "done"]).default("todo"),
});

async function authorized(req: Request) {
  const session = await auth();
  if (session) return true;
  const key = req.headers.get("x-api-key") || "";
  const expected = process.env.DASH_API_KEY || "";
  return !!expected && key === expected;
}

async function moveOtherInProgressToTodo(exceptTaskId?: string) {
  await prisma.task.updateMany({
    where: {
      status: "in_progress",
      ...(exceptTaskId ? { NOT: { id: exceptTaskId } } : {}),
    },
    data: { status: "todo" },
  });
}

export async function GET(req: Request) {
  if (!(await authorized(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const where = status && ["todo", "in_progress", "blocked", "done"].includes(status) ? { status } : undefined;

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ status: "asc" }, { orderIndex: "asc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  if (!(await authorized(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = TaskCreateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const { title, status } = parsed.data;

  if (status === "in_progress") {
    await moveOtherInProgressToTodo();
  }

  const last = await prisma.task.findFirst({
    where: { status },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  });

  const orderIndex = (last?.orderIndex ?? 0) + 1;

  const task = await prisma.task.create({
    data: { title, status, orderIndex },
  });

  return NextResponse.json({ task }, { status: 201 });
}
