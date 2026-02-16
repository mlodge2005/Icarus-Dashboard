import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getS3, bucketName } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const MAX_BYTES = 50 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "invalid form" }, { status: 400 });

    const file = form.get("file");
    const taskIdRaw = form.get("taskId");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ error: "file size out of range" }, { status: 400 });
    }

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `artifacts/${year}/${month}/${crypto.randomUUID()}-${safeName}`;

    const bytes = await file.arrayBuffer();

    const s3 = getS3();
    const cmd = new PutObjectCommand({
      Bucket: bucketName(),
      Key: storageKey,
      ContentType: file.type || "application/octet-stream",
    });
    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 900 });

    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "content-type": file.type || "application/octet-stream" },
      body: bytes,
    });

    if (!putRes.ok) {
      const body = await putRes.text().catch(() => "");
      return NextResponse.json(
        { error: `upload failed (${putRes.status})`, detail: body.slice(0, 500) },
        { status: 502 }
      );
    }

    const taskId = typeof taskIdRaw === "string" && taskIdRaw.trim() ? taskIdRaw : null;

    const artifact = await prisma.artifact.create({
      data: {
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        storageKey,
        taskId,
      },
    });

    return NextResponse.json({ artifact }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "server upload exception", detail: message }, { status: 500 });
  }
}
