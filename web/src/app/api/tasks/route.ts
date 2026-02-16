import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TaskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  status: z.enum(["todo", "in_progress", "done"]),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const tasks = await prisma.task.findMany({
    orderBy: [{ status: "asc" }, { orderIndex: "asc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = TaskCreateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const { title, status } = parsed.data;

  // put new tasks at the bottom of the column
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
