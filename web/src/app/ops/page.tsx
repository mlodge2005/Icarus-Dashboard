"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function OpsPage() {
  const snap = useQuery(api.ops.snapshot, {}) as any;
  const createTask = useMutation(api.tasks.create);
  if (!snap) return <div className="wrap">Loading...</div>;
  const empty = snap.now.length===0 && snap.next.length===0 && snap.blocked.length===0;

  return (
    <div className="wrap">
      <h1>Ops Command Center</h1>
      {empty ? <div className="card">No active work yet. <button onClick={()=>void createTask({title:"Initial Task",description:"",status:"todo",priority:"medium",dueDate:new Date().toISOString(),tags:[],externalLinks:[],now:new Date().toISOString()})}>Create starter task</button></div> : null}
      <div className="grid">
        <section className="col"><h3>Now</h3>{snap.now.map((t: any) => <div className="card" key={t._id}>{t.title}</div>)}</section>
        <section className="col"><h3>Next</h3>{snap.next.map((t: any) => <div className="card" key={t._id}>{t.title}</div>)}</section>
        <section className="col"><h3>Blocked</h3>{snap.blocked.map((t: any) => <div className="card" key={t._id}>{t.title}</div>)}</section>
      </div>
      <h3 style={{marginTop:16}}>Execution Timeline</h3>
      {(snap.latestActivity as any[]).length===0 ? <div className="card">No activity yet.</div> : null}
      {(snap.latestActivity as any[]).map((a: any) => (<div className="card" key={a._id}><small>{a.createdAt}</small> — <strong>{a.entityType}</strong> — {a.summary}</div>))}
    </div>
  );
}
