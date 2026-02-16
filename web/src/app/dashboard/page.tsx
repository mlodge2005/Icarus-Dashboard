import { auth } from "@/auth";
import { OverviewPanel } from "@/components/OverviewPanel";
import { UserMenu } from "@/components/UserMenu";
import { prisma } from "@/lib/prisma";

async function getOverview() {
  const bot = await prisma.bot.findFirst({ orderBy: { updatedAt: "desc" } });
  const [todo, in_progress, done] = await Promise.all([
    prisma.task.count({ where: { status: "todo" } }),
    prisma.task.count({ where: { status: "in_progress" } }),
    prisma.task.count({ where: { status: "done" } }),
  ]);

  return {
    bot: bot
      ? {
          ...bot,
          lastHeartbeatAt: bot.lastHeartbeatAt ? bot.lastHeartbeatAt.toISOString() : null,
        }
      : null,
    counts: { todo, in_progress, done },
  };
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

  return (
    <>
      <div className="topbar">
        <div className="h1">Overview</div>
        <UserMenu email={session.user?.email ?? null} />
      </div>
      <OverviewPanel initial={data} />
    </>
  );
}
