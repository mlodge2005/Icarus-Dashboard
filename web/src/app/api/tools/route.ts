import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const tools = await prisma.tool.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
  return NextResponse.json({ tools });
}
