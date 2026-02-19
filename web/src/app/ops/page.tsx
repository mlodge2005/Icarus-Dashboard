"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function OpsPage() {
  const snap = useQuery((api as any).ops.snapshot, {}) as any;
  const [filter, setFilter] = useState("all");
  if (!snap) return <div className="wrap">Loading...</div>;

  const events = (snap.latestActivity as any[]).filter((a) => {
    if (filter === "all") return true;
    if (filter === "blocked") return String(a.eventType).includes("blocked");
    if (filter === "protocol") return String(a.entityType) === "protocol";
    if (filter === "task") return String(a.entityType) === "task";
    return true;
  });

  return (
    <div className="wrap">
      <h1>Ops Command Center</h1>
      <p><small>Now = in progress. Next = todo queue. Blocked = tasks tagged “blocked”.</small></p>
      <div className="grid">
        <section className="col"><h3>Now</h3>{snap.now.map((t: any) => <div className="card" key={t._id}>{t.title}</div>)}</section>
        <section className="col"><h3>Next</h3>{snap.next.map((t: any) => <div className="card" key={t._id}>{t.title}</div>)}</section>
        <section className="col"><h3>Blocked</h3>{snap.blocked.length ? snap.blocked.map((t: any) => <div className="card" key={t._id}>{t.title}</div>) : <small>No blocked tasks tagged yet</small>}</section>
      </div>

      <div className="head" style={{marginTop:16}}>
        <h3>Execution Timeline</h3>
        <div>
          <label><small>Filter events:</small> </label>
          <select value={filter} onChange={(e)=>setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="task">Task</option>
            <option value="protocol">Protocol</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>
      {events.map((a: any) => (
        <div className="card" key={a._id}><small>{a.createdAt}</small> — <strong>{a.entityType}</strong> — {a.summary}</div>
      ))}
    </div>
  );
}
