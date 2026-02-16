import { auth } from "@/auth";
import { TaskBoard } from "@/components/TaskBoard";
import { prisma } from "@/lib/prisma";

export default async function TasksPage() {
  const session = await auth();
  if (!session) {
    return (
      <div className="card cardPad">
        <div className="h1">Tasks</div>
        <p style={{ color: "var(--muted)" }}>Please sign in.</p>
      </div>
    );
  }

  const initialTasks = await prisma.task.findMany({ orderBy: [{ status: "asc" }, { orderIndex: "asc" }] });

  return <TaskBoard initialTasks={initialTasks.map((t) => ({ ...t, updatedAt: t.updatedAt.toISOString() }))} />;
}
