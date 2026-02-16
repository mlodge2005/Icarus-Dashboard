import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNowStrict } from "date-fns";

async function getOverview() {
  const bot = await prisma.bot.findFirst({ orderBy: { updatedAt: "desc" } });
  const [todo, in_progress, done] = await Promise.all([
    prisma.task.count({ where: { status: "todo" } }),
    prisma.task.count({ where: { status: "in_progress" } }),
    prisma.task.count({ where: { status: "done" } }),
  ]);

  return {
    bot,
    counts: { todo, in_progress, done },
  };
}

function statusFromHeartbeat(last: Date | null) {
  if (!last) return { label: "Offline", color: "var(--bad)" };
  const ageSec = (Date.now() - last.getTime()) / 1000;
  if (ageSec <= 30) return { label: "Online", color: "var(--good)" };
  if (ageSec <= 120) return { label: "Degraded", color: "var(--warn)" };
  return { label: "Offline", color: "var(--bad)" };
}

export default async function OverviewPage() {
  const session = await auth();
  if (!session) {
    return (
      <div className="card cardPad">
        <div className="h1">Icarus Dashboard</div>
        <p style={{ color: "var(--muted)" }}>Please sign in.</p>
      </div>
    );
  }

  let data: Awaited<ReturnType<typeof getOverview>>;
  try {
    data = await getOverview();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return (
      <div className="card cardPad">
        <div className="h1">Overview</div>
        <p style={{ color: "var(--muted)" }}>
          Server error loading overview. Check Vercel runtime logs and ensure Neon env vars + Prisma migrations are applied.
        </p>
        <div style={{ marginTop: 10, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12, color: "var(--muted)" }}>
          {msg}
        </div>
      </div>
    );
  }

  const last = data.bot?.lastHeartbeatAt ? new Date(data.bot.lastHeartbeatAt) : null;
  const s = statusFromHeartbeat(last);

  return (
    <>
      <div className="topbar">
        <div className="h1">Overview</div>
        <div className="badge">
          <span className="dot" style={{ background: s.color }} />
          {s.label}
        </div>
      </div>

      <div className="grid grid2">
        <div className="card cardPad">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <div>
              <div style={{ fontWeight: 650 }}>{data.bot?.name || "Icarus"}</div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                Last heartbeat: {last ? formatDistanceToNowStrict(last, { addSuffix: true }) : "never"}
              </div>
            </div>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>v{data.bot?.version || "—"}</div>
          </div>

          <div style={{ marginTop: 14, color: "var(--muted)", fontSize: 12 }}>Current task</div>
          <div style={{ marginTop: 6, fontWeight: 650 }}>{data.bot?.currentTaskId || "—"}</div>
        </div>

        <div className="card cardPad">
          <div style={{ fontWeight: 650, marginBottom: 10 }}>Quick counts</div>
          <div className="kpis">
            <div className="kpi">
              <div className="kpiLabel">Todo</div>
              <div className="kpiValue">{data.counts.todo}</div>
            </div>
            <div className="kpi">
              <div className="kpiLabel">In Progress</div>
              <div className="kpiValue">{data.counts.in_progress}</div>
            </div>
            <div className="kpi">
              <div className="kpiLabel">Done</div>
              <div className="kpiValue">{data.counts.done}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />
      <div className="card cardPad" style={{ color: "var(--muted)", fontSize: 13 }}>
        Status updates poll automatically (no refresh required).
      </div>
    </>
  );
}
