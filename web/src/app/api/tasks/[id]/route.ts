import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TaskPatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(["todo", "in_progress", "blocked", "done"]).optional(),
  orderIndex: z.number().finite().optional(),
  notes: z.string().max(20000).nullable().optional(),
});

async function authorized(req: Request) {
  const session = await auth();
  if (session) return true;
  const key = req.headers.get("x-api-key") || "";
  const expected = process.env.DASH_API_KEY || "";
  return !!expected && key === expected;
}

async function moveOtherInProgressToTodo(exceptTaskId: string) {
  await prisma.task.updateMany({
    where: { status: "in_progress", NOT: { id: exceptTaskId } },
    data: { status: "todo" },
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await authorized(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = TaskPatchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const data = parsed.data;

  if (data.status === "in_progress") {
    await moveOtherInProgressToTodo(id);
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.orderIndex !== undefined ? { orderIndex: data.orderIndex } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
  });

  return NextResponse.json({ task });
}
