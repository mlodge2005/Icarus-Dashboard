import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getS3, bucketName } from "@/lib/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const artifact = await prisma.artifact.findUnique({ where: { id } });
  if (!artifact) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Best-effort object deletion for legacy R2-backed artifacts.
  if (!artifact.storageKey.startsWith("db64:")) {
    try {
      const s3 = getS3();
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucketName(),
          Key: artifact.storageKey,
        })
      );
    } catch {
      // Ignore external cleanup failure; still remove DB row.
    }
  }

  await prisma.artifact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
