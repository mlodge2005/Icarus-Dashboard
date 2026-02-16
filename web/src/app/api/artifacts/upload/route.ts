import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 10 * 1024 * 1024;

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

    const bytes = new Uint8Array(await file.arrayBuffer());
    const storageKey = `db64:${Buffer.from(bytes).toString("base64")}`;

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
