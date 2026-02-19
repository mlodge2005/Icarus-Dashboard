"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Status } from "@/lib/types";

const cols: Status[] = ["todo", "in_progress", "done"];

export default function Dashboard() {
  const tasks = (useQuery((api as any).tasks.list, {}) as any[] | undefined) ?? [];
  const move = useMutation((api as any).tasks.moveStatus);
  const create = useMutation((api as any).tasks.create);
  const activity = (useQuery((api as any).activity.listGlobal, {}) as any[] | undefined) ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const grouped = useMemo(
    () => Object.fromEntries(cols.map((c) => [c, tasks.filter((t) => t.status === c)])) as Record<Status, any[]>,
    [tasks],
  );

  const selected = tasks.find((t) => t._id === selectedId);

  return (
    <div className="wrap">
      <div className="head">
        <h1>Dashboard</h1>
        <button onClick={() => void create({ title: `Task ${tasks.length + 1}`, description: "", status: "todo", priority: "medium", dueDate: new Date().toISOString(), tags: [], externalLinks: [], now: new Date().toISOString() })}>New Task</button>
      </div>
      <div className="grid">
        {cols.map((col) => (
          <section key={col} className="col" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const id = e.dataTransfer.getData("taskId"); if (id) void move({ id, to: col, now: new Date().toISOString() }); }}>
            <strong>{col}</strong>
            {grouped[col].map((task) => (
              <article key={task._id} className="card" draggable onDragStart={(e) => e.dataTransfer.setData("taskId", task._id)} onClick={() => setSelectedId(task._id)}>
                <div>{task.title}</div>
                <small>{task.priority}</small>
              </article>
            ))}
          </section>
        ))}
      </div>
      {selected && (
        <aside className="col" style={{ marginTop: 12 }}>
          <h3>Task Detail</h3>
          <div>title: {selected.title}</div><div>description: {selected.description ?? ""}</div><div>status: {selected.status}</div><div>priority: {selected.priority}</div><div>dueDate: {selected.dueDate ?? ""}</div><div>tags: {(selected.tags ?? []).join(",")}</div><div>related project: {selected.projectId ?? ""}</div><div>external links: {(selected.externalLinks ?? []).join(",")}</div><div>createdAt: {selected.createdAt}</div><div>updatedAt: {selected.updatedAt}</div>
          <h4>Activity</h4>
          {activity.filter((a) => a.entityType === "task" && a.entityId === selected._id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((a) => (<div key={a._id}><small>{a.createdAt}</small> {a.summary}</div>))}
        </aside>
      )}
    </div>
  );
}
