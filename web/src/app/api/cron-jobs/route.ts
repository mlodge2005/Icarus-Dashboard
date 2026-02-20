import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function GET() {
  try {
    const { stdout } = await execFileAsync("openclaw", ["cron", "list", "--json"], {
      timeout: 10000,
      maxBuffer: 2 * 1024 * 1024,
    });

    const parsed = JSON.parse(stdout || "{}");
    const jobs = Array.isArray(parsed?.jobs) ? parsed.jobs : [];
    return NextResponse.json({ ok: true, jobs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch cron jobs";
    return NextResponse.json({ ok: false, error: message, jobs: [] }, { status: 500 });
  }
}
