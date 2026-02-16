import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TaskPatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  orderIndex: z.number().finite().optional(),
  notes: z.string().max(20000).nullable().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = TaskPatchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const data = parsed.data;

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
