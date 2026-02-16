import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getS3, bucketName } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const artifact = await prisma.artifact.findUnique({ where: { id } });
  if (!artifact) return NextResponse.json({ error: "not found" }, { status: 404 });

  const s3 = getS3();
  const cmd = new GetObjectCommand({
    Bucket: bucketName(),
    Key: artifact.storageKey,
    ResponseContentDisposition: `attachment; filename="${artifact.filename}"`,
  });

  const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });
  return NextResponse.json({ url });
}
