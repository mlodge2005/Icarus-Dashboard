import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const artifacts = await prisma.artifact.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ artifacts });
}
