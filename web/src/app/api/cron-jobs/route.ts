import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type CronRunEntry = {
  status?: string;
  summary?: string;
  durationMs?: number;
  runAtMs?: number;
};

type CronJob = {
  id: string;
  name?: string;
  description?: string;
  enabled?: boolean;
  schedule?: { kind?: string; expr?: string; tz?: string };
  state?: { nextRunAtMs?: number; lastRunAtMs?: number; lastStatus?: string };
  payload?: { kind?: string; message?: string; text?: string };
  sessionTarget?: string;
};

function inferTools(job: CronJob): string[] {
  const tools = new Set<string>();
  const payloadText = `${job.payload?.message ?? ""} ${job.payload?.text ?? ""}`.toLowerCase();

  if (job.payload?.kind === "systemEvent") tools.add("messaging");
  if (job.payload?.kind === "agentTurn") tools.add("agent-turn");
  if (payloadText.includes("openclaw ")) tools.add("openclaw-cli");
  if (payloadText.includes("bash ") || payloadText.includes("/bin/") || payloadText.includes("execute:")) tools.add("exec");
  if (payloadText.includes("write") || payloadText.includes("file")) tools.add("filesystem");

  return Array.from(tools);
}

function buildOutcomeSummary(run?: CronRunEntry): string {
  if (!run) return "No runs yet.";
  const status = run.status ?? "unknown";
  const summary = run.summary?.trim() || "No summary provided.";
  const dur = typeof run.durationMs === "number" ? ` (${run.durationMs}ms)` : "";
  return `${status.toUpperCase()}: ${summary}${dur}`;
}

export async function GET() {
  try {
    const { stdout } = await execFileAsync("openclaw", ["cron", "list", "--json"], {
      timeout: 10000,
      maxBuffer: 2 * 1024 * 1024,
    });

    const parsed = JSON.parse(stdout || "{}");
    const jobs: CronJob[] = Array.isArray(parsed?.jobs) ? parsed.jobs : [];

    const enriched = await Promise.all(
      jobs.map(async (job) => {
        let latestRun: CronRunEntry | undefined;
        try {
          const { stdout: runsOut } = await execFileAsync(
            "openclaw",
            ["cron", "runs", "--id", job.id, "--limit", "1"],
            { timeout: 10000, maxBuffer: 1024 * 1024 },
          );
          const runsParsed = JSON.parse(runsOut || "{}");
          latestRun = Array.isArray(runsParsed?.entries) ? runsParsed.entries[0] : undefined;
        } catch {
          latestRun = undefined;
        }

        return {
          ...job,
          displayTitle: job.name || `Cron Job ${job.id.slice(0, 8)}`,
          outcomeSummary: buildOutcomeSummary(latestRun),
          toolsUsed: inferTools(job),
          latestRun,
        };
      }),
    );

    return NextResponse.json({ ok: true, jobs: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch cron jobs";
    return NextResponse.json({ ok: false, error: message, jobs: [] }, { status: 500 });
  }
}
