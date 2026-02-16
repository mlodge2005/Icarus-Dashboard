import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const BodySchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(200),
  sizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
  storageKey: z.string().min(1).max(1024),
  taskId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const artifact = await prisma.artifact.create({
    data: parsed.data,
  });

  return NextResponse.json({ artifact }, { status: 201 });
}
