import { auth } from "@/auth";
import { TaskDetailForm } from "@/components/TaskDetailForm";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    return (
      <div className="card cardPad">
        <div className="h1">Task</div>
        <p style={{ color: "var(--muted)" }}>Please sign in.</p>
      </div>
    );
  }

  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return notFound();

  return (
    <TaskDetailForm
      task={{
        id: task.id,
        title: task.title,
        status: task.status as "todo" | "in_progress" | "blocked" | "done",
        notes: task.notes,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      }}
    />
  );
}
