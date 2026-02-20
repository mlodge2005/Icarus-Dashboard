"use client";
import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const blockerHints: Record<string, string> = {
  missing_credential: "Resolve by adding the missing key/token/env variable.",
  needs_approval: "Resolve by explicitly approving the blocked action.",
  dependency_down: "Resolve by restoring service dependency or network path.",
  ambiguous_input: "Resolve by clarifying task intent/inputs.",
  other: "Resolve by reviewing task details and latest activity.",
};

export default function OpsPage() {
  const snap = useQuery(api.ops.snapshot as any, {}) as any;
  const runtime = (useQuery(api.runtime.list as any, {}) as any[] | undefined) ?? [];
  const logs = (useQuery(api.runtime.recentLogs as any, {}) as any[] | undefined) ?? [];
  const probeRuntime = useAction(api.runtime.probe as any);
  const createTask = useMutation(api.tasks.create as any);
  const resolveBlocker = useMutation(api.tasks.resolveBlocker as any);
  const removeTask = useMutation(api.tasks.remove as any);
  const [msg, setMsg] = useState("");

  if (!snap) return <div className="wrap">Loading...</div>;
  const empty = snap.now.length===0 && snap.next.length===0 && snap.blocked.length===0;

  return (
    <div className="wrap">
      <h1>Ops Command Center</h1>
      <p><small>System triage + connectivity + processing/runtime logs.</small></p>
      {msg ? <small>{msg}</small> : null}

      {empty ? <div className="card">No active work yet. <button onClick={()=>void createTask({title:"Initial Task",description:"",status:"todo",priority:"medium",dueDate:new Date().toISOString(),tags:[],externalLinks:[],now:new Date().toISOString()})}>Create starter task</button></div> : null}
      <div className="grid">
        <section className="col"><h3>Now</h3>{snap.now.map((t: any) => <div className="card" key={t._id}>{t.title}</div>)}</section>
        <section className="col"><h3>Next</h3>{snap.next.map((t: any) => <div className="card" key={t._id}><strong>{t.title}</strong><div style={{display:"flex",gap:8,marginTop:6}}><button onClick={async()=>{try{await removeTask({id:t._id,now:new Date().toISOString()});setMsg("Task deleted.");}catch(e){setMsg((e as Error).message)}}}>Delete</button></div></div>)}</section>
        <section className="col"><h3>Blocked</h3>{snap.blocked.map((t: any) => <div className="card" key={t._id}><strong>{t.title}</strong><div><small>Reason:</small> {t.blockerReason ?? "not set"}</div>{t.blockerReason ? <div><small>Fix:</small> {blockerHints[t.blockerReason] ?? blockerHints.other}</div> : <div><small>Fix:</small> set blockerReason on task update.</div>}<div style={{display:"flex",gap:8,marginTop:6}}><button onClick={async()=>{try{await resolveBlocker({id:t._id,resumeStatus:"in_progress",now:new Date().toISOString()});setMsg("Blocker resolved. Task resumed.");}catch(e){setMsg((e as Error).message)}}}>Resolve + Resume</button><button onClick={async()=>{try{await removeTask({id:t._id,now:new Date().toISOString()});setMsg("Blocked task deleted.");}catch(e){setMsg((e as Error).message)}}}>Delete</button></div></div>)}</section>
      </div>

      <h3 style={{marginTop:16}}>Execution Timeline</h3>
      {(logs.length===0 && (snap.latestActivity as any[]).length===0) ? <div className="card">No activity yet.</div> : null}
      {logs.map((l:any)=><div className="card" key={l._id}><small>{l.createdAt}</small> — <strong>{l.source}</strong> — {l.action} {l.detail ? `| ${l.detail}` : ""}</div>)}
      {(snap.latestActivity as any[]).map((a: any) => (<div className="card" key={a._id}><small>{a.createdAt}</small> — <strong>{a.entityType}</strong> — {a.summary}</div>))}
    </div>
  );
}
