"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Status } from "@/lib/types";

const cols: Status[] = ["todo", "in_progress", "done"];

export default function Dashboard() {
  const tasks = (useQuery(api.tasks.list, {}) as any[] | undefined) ?? [];
  const move = useMutation(api.tasks.moveStatus);
  const create = useMutation(api.tasks.create);
  const activity = (useQuery(api.activity.listGlobal, {}) as any[] | undefined) ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");

  const grouped = useMemo(() => Object.fromEntries(cols.map((c) => [c, tasks.filter((t) => t.status === c)])) as Record<Status, any[]>, [tasks]);
  const selected = tasks.find((t) => t._id === selectedId);

  const onCreate = async () => {
    try {
      await create({ title: `Task ${tasks.length + 1}`, description: "", status: "todo", priority: "medium", dueDate: new Date().toISOString(), tags: [], externalLinks: [], now: new Date().toISOString() });
      setMsg("Task created.");
    } catch (e) { setMsg(`Create failed: ${(e as Error).message}`); }
  };

  return (
    <div className="wrap">
      <div className="head"><h1>Dashboard</h1><button onClick={onCreate}>New Task</button></div>
      {msg ? <small>{msg}</small> : null}
      <p><small>Drag a task card to move status. Click a task for details.</small></p>
      <div className="grid">
        {cols.map((col) => (
          <section key={col} className="col" onDragOver={(e) => e.preventDefault()} onDrop={async (e) => {
            const id = e.dataTransfer.getData("taskId");
            if (!id) return;
            try { await move({ id, to: col, now: new Date().toISOString() }); setMsg("Task moved."); }
            catch (err) { setMsg(`Move failed: ${(err as Error).message}`); }
          }}>
            <strong>{col}</strong>
            {grouped[col].map((task) => (
              <article key={task._id} className="card" draggable onDragStart={(e) => e.dataTransfer.setData("taskId", task._id)} onClick={() => setSelectedId(task._id)}>
                <div>{task.title}</div><small>{task.priority}</small>
              </article>
            ))}
          </section>
        ))}
      </div>
      {selected && <aside className="col" style={{ marginTop: 12 }}><h3>Task Detail</h3><div>title: {selected.title}</div><div>status: {selected.status}</div><h4>Activity</h4>{activity.filter((a) => a.entityType === "task" && a.entityId === selected._id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((a) => (<div key={a._id}><small>{a.createdAt}</small> {a.summary}</div>))}</aside>}
    </div>
  );
}
