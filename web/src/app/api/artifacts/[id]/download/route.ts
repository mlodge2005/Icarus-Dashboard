import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getS3, bucketName } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const artifact = await prisma.artifact.findUnique({ where: { id } });
  if (!artifact) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (artifact.storageKey.startsWith("db64:")) {
    const b64 = artifact.storageKey.slice(5);
    const out = Buffer.from(b64, "base64");
    return new Response(out, {
      status: 200,
      headers: {
        "content-type": artifact.mimeType || "application/octet-stream",
        "content-disposition": `attachment; filename="${artifact.filename}"`,
        "cache-control": "private, no-store",
      },
    });
  }

  const s3 = getS3();
  const obj = await s3.send(
    new GetObjectCommand({
      Bucket: bucketName(),
      Key: artifact.storageKey,
    })
  );

  if (!obj.Body) return NextResponse.json({ error: "empty body" }, { status: 404 });

  const bytes = await obj.Body.transformToByteArray();
  const out = new Uint8Array(bytes.length);
  out.set(bytes);

  return new Response(out, {
    status: 200,
    headers: {
      "content-type": artifact.mimeType || "application/octet-stream",
      "content-disposition": `attachment; filename="${artifact.filename}"`,
      "cache-control": "private, no-store",
    },
  });
}
