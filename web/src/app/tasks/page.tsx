import { auth } from "@/auth";
import { TaskBoard } from "@/components/TaskBoard";
import { prisma } from "@/lib/prisma";

type TaskStatus = "todo" | "in_progress" | "done";

function toStatus(status: string): TaskStatus {
  if (status === "todo" || status === "in_progress" || status === "done") return status;
  return "todo";
}

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

  return (
    <TaskBoard
      initialTasks={initialTasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: toStatus(t.status),
        orderIndex: t.orderIndex,
        notes: t.notes,
        updatedAt: t.updatedAt.toISOString(),
      }))}
    />
  );
}
