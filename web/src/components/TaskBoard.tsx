"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";

type TaskStatus = "todo" | "in_progress" | "done";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  orderIndex: number;
  notes: string | null;
  updatedAt: string;
};

const STATUS_COLUMNS: Array<{ key: TaskStatus; label: string }> = [
  { key: "todo", label: "Todo" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

function colId(status: TaskStatus) {
  return `col:${status}`;
}

function parseCol(id: string): TaskStatus | null {
  if (!id.startsWith("col:")) return null;
  const raw = id.slice(4);
  return raw === "todo" || raw === "in_progress" || raw === "done" ? raw : null;
}

function computeOrderIndex(list: Task[], insertIndex: number) {
  const prev = list[insertIndex - 1];
  const next = list[insertIndex + 1];
  if (prev && next) return (prev.orderIndex + next.orderIndex) / 2;
  if (!prev && next) return next.orderIndex - 1;
  if (prev && !next) return prev.orderIndex + 1;
  return 0;
}

function ColumnDropZone({ status, children }: { status: TaskStatus; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: colId(status) });
  return (
    <div
      ref={setNodeRef}
      className="colBody card cardPad"
      style={{ minHeight: "52vh", outline: isOver ? "1px solid rgba(110,168,254,.55)" : "none" }}
    >
      {children}
    </div>
  );
}

function SortableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  return (
    <Link href={`/tasks/${task.id}`} style={{ textDecoration: "none" }}>
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.6 : 1,
        }}
        className="cardItem"
        {...attributes}
        {...listeners}
      >
        <div className="cardTitle">{task.title}</div>
        <div className="cardMeta">
          <span>{formatDistanceToNowStrict(new Date(task.updatedAt), { addSuffix: true })}</span>
          <span>{task.notes ? "🗒️" : ""}</span>
        </div>
      </div>
    </Link>
  );
}

export function TaskBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>([...initialTasks].sort((a, b) => a.orderIndex - b.orderIndex));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const byStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    for (const t of tasks) grouped[t.status].push(t);
    for (const k of Object.keys(grouped) as TaskStatus[]) grouped[k].sort((a, b) => a.orderIndex - b.orderIndex);
    return grouped;
  }, [tasks]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) ?? null : null;

  async function createTask() {
    const title = newTitle.trim();
    if (!title) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, status: "todo" }),
      });
      if (!res.ok) throw new Error("create failed");
      const data = (await res.json()) as { task: Task };
      setTasks((prev) => [...prev, data.task]);
      setNewTitle("");
    } finally {
      setCreating(false);
    }
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function maybeRebalance(status: TaskStatus, list: Task[]) {
    if (list.length < 2) return;
    let minGap = Number.POSITIVE_INFINITY;
    for (let i = 1; i < list.length; i++) minGap = Math.min(minGap, list[i].orderIndex - list[i - 1].orderIndex);
    if (minGap > 0.00001) return;

    const reindexed = list.map((t, i) => ({ ...t, orderIndex: i + 1 }));
    setTasks((prev) => prev.map((t) => reindexed.find((r) => r.id === t.id) ?? t));

    await Promise.all(
      reindexed.map((t) =>
        fetch(`/api/tasks/${t.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderIndex: t.orderIndex }),
        })
      )
    );
  }

  async function onDragEnd(event: DragEndEvent) {
    const active = String(event.active.id);
    const over = event.over ? String(event.over.id) : null;
    setActiveId(null);
    if (!over) return;
    if (active === over) return;

    const current = tasks.find((t) => t.id === active);
    if (!current) return;

    const overTask = tasks.find((t) => t.id === over);
    const targetStatus = parseCol(over) ?? overTask?.status;
    if (!targetStatus) return;

    const sourceStatus = current.status;

    const nextTasks = [...tasks];
    const currentIdx = nextTasks.findIndex((t) => t.id === current.id);
    nextTasks.splice(currentIdx, 1);

    const targetList = nextTasks.filter((t) => t.status === targetStatus).sort((a, b) => a.orderIndex - b.orderIndex);
    let insertIndex = targetList.length;
    if (overTask) {
      insertIndex = targetList.findIndex((t) => t.id === overTask.id);
      if (insertIndex < 0) insertIndex = targetList.length;
    }

    const moved: Task = { ...current, status: targetStatus, orderIndex: 0 };
    const targetAfter = [...targetList];
    targetAfter.splice(insertIndex, 0, moved);
    moved.orderIndex = computeOrderIndex(targetAfter, insertIndex);

    nextTasks.push(moved);

    setTasks(nextTasks);

    try {
      const res = await fetch(`/api/tasks/${moved.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: moved.status, orderIndex: moved.orderIndex }),
      });
      if (!res.ok) throw new Error("persist failed");
      await maybeRebalance(targetStatus, targetAfter);
      if (sourceStatus !== targetStatus) {
        const sourceAfter = nextTasks.filter((t) => t.status === sourceStatus).sort((a, b) => a.orderIndex - b.orderIndex);
        await maybeRebalance(sourceStatus, sourceAfter);
      }
    } catch {
      setTasks(tasks);
    }
  }

  return (
    <>
      <div className="topbar">
        <div className="h1">Tasks</div>
      </div>

      <div className="card cardPad" style={{ marginBottom: 12, display: "flex", gap: 10 }}>
        <input
          className="input"
          placeholder="Add task title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void createTask();
          }}
        />
        <button className="btn" onClick={() => void createTask()} disabled={creating}>
          {creating ? "Adding..." : "Add"}
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="board">
          {STATUS_COLUMNS.map((col) => (
            <div key={col.key} className="col">
              <div className="colHead">
                <span>{col.label}</span>
                <span>{byStatus[col.key].length}</span>
              </div>
              <ColumnDropZone status={col.key}>
                <SortableContext items={byStatus[col.key].map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {byStatus[col.key].length === 0 ? (
                    <div style={{ color: "var(--muted)", fontSize: 13, padding: 8 }}>Empty</div>
                  ) : (
                    byStatus[col.key].map((task) => <SortableTask key={task.id} task={task} />)
                  )}
                </SortableContext>
              </ColumnDropZone>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="cardItem" style={{ width: 320 }}>
              <div className="cardTitle">{activeTask.title}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
