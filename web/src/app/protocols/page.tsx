"use client";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function ProtocolsPage() {
  const protocols = (useQuery((api as any).protocols.list, {}) as any[] | undefined) ?? [];
  const runs = (useQuery((api as any).protocols.listRuns, {}) as any[] | undefined) ?? [];
  const create = useMutation((api as any).protocols.create);
  const run = useMutation((api as any).protocols.run);
  const seedTemplates = useMutation((api as any).protocols.createTemplateSet);

  const [name, setName] = useState("Daily Ops Triage");
  const [objective, setObjective] = useState("Triage work, unblock critical tasks, and report next actions.");
  const [steps, setSteps] = useState("Check Now/Next/Blocked\nCheck inbox mentions\nUpdate priorities\nSend summary");

  return (
    <div className="wrap">
      <h1>Protocol Builder</h1>
      <div className="head">
        <button onClick={() => void seedTemplates({ now: new Date().toISOString() })}>Seed Templates</button>
      </div>
      <div className="col">
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Protocol name" style={{width:"100%",marginBottom:8}} />
        <textarea value={objective} onChange={(e)=>setObjective(e.target.value)} placeholder="Objective" style={{width:"100%",marginBottom:8}} />
        <textarea value={steps} onChange={(e)=>setSteps(e.target.value)} placeholder="One step per line" style={{width:"100%",height:120,marginBottom:8}} />
        <button onClick={() => void create({ name, trigger: "manual", objective, steps: steps.split("\n").map(s => s.trim()).filter(Boolean), approvalsRequired: true, now: new Date().toISOString() })}>Create Protocol</button>
      </div>

      <h3 style={{marginTop:16}}>Protocols</h3>
      {protocols.map((p) => (
        <div className="card" key={p._id}>
          <strong>{p.name}</strong> <small>({p.trigger}) • approvals: {p.approvalsRequired ? "required" : "not required"}</small>
          <div>{p.objective}</div>
          <ol>{(p.steps ?? []).map((s: string, i: number) => <li key={i}>{s}</li>)}</ol>
          <div style={{display:"flex",gap:8}}>
            <button onClick={() => void run({ protocolId: p._id, now: new Date().toISOString() })}>Run (no approval)</button>
            <button onClick={() => void run({ protocolId: p._id, now: new Date().toISOString(), approvalGranted: true })}>Run (approved)</button>
          </div>
        </div>
      ))}

      <h3 style={{marginTop:16}}>Run History</h3>
      {runs.map((r) => <div className="card" key={r._id}><small>{r.startedAt}</small> — {r.status} — {r.output ?? r.error ?? ""}</div>)}
    </div>
  );
}
