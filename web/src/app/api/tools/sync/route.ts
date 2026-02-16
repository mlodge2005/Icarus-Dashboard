import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const BodySchema = z.object({
  tools: z.array(
    z.object({
      name: z.string().min(1).max(120),
      category: z.string().min(1).max(80),
      enabled: z.boolean(),
      notes: z.string().max(500).optional(),
    })
  ),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const incoming = parsed.data.tools;

  await Promise.all(
    incoming.map((t) =>
      prisma.tool.upsert({
        where: { name: t.name },
        create: { name: t.name, category: t.category, enabled: t.enabled, notes: t.notes },
        update: { category: t.category, enabled: t.enabled, notes: t.notes },
      })
    )
  );

  const names = incoming.map((t) => t.name);
  await prisma.tool.deleteMany({ where: { name: { notIn: names } } });

  return NextResponse.json({ ok: true, count: incoming.length });
}
