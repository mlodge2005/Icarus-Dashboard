import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import { getS3, bucketName } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BodySchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(200),
  sizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
  taskId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const { filename, mimeType } = parsed.data;

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = `artifacts/${year}/${month}/${crypto.randomUUID()}-${safeName}`;

  const s3 = getS3();
  const cmd = new PutObjectCommand({
    Bucket: bucketName(),
    Key: storageKey,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 900 });

  return NextResponse.json({ uploadUrl, storageKey });
}
