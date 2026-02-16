"use client";

import { useState } from "react";

type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

function getPollIndicator(notes: string) {
  const m = notes.match(/^\[queue-monitor\]\s+polling=(\w+)\s+lastPollAt=([^\n]+)/m);
  if (!m) return null;
  return { polling: m[1], lastPollAt: m[2] };
}

export function TaskDetailForm({ task }: { task: Task }) {
  const [title, setTitle] = useState(task.title);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const poll = getPollIndicator(notes);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim(), status, notes }),
      });
      if (!res.ok) throw new Error("save failed");
      setSavedAt(new Date().toISOString());
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <div className="h1">Task</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>
          <button className="btn" onClick={() => void save()} disabled={saving || !title.trim()}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="card cardPad" style={{ marginBottom: 12 }}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="card cardPad" style={{ marginBottom: 12 }}>
        <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6, display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span>Notes</span>
          {poll ? (
            <span>
              Queue poll: {poll.polling} · last {new Date(poll.lastPollAt).toLocaleString()}
            </span>
          ) : (
            <span>Queue poll: unknown</span>
          )}
        </div>
        <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="card cardPad" style={{ marginBottom: 12 }}>
        <div style={{ color: "var(--muted)", fontSize: 12 }}>Artifacts</div>
        <div style={{ marginTop: 6, color: "var(--muted)" }}>No linked artifacts yet.</div>
      </div>

      <div className="card cardPad" style={{ color: "var(--muted)", fontSize: 12 }}>
        Created: {new Date(task.createdAt).toLocaleString()} · Updated: {new Date(task.updatedAt).toLocaleString()}
        {savedAt ? ` · Saved ${new Date(savedAt).toLocaleTimeString()}` : ""}
      </div>
    </>
  );
}
