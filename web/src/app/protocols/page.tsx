"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Protocol, ProtocolRun } from "@/lib/models";

function RunSteps({ runId }: { runId: string }) {
  const steps = (useQuery((api as any).protocols.runSteps, { runId }) as any[] | undefined) ?? [];
  return <ol>{steps.map((s) => <li key={s._id}><small>#{s.stepIndex + 1}</small> {s.stepText} — {s.status}</li>)}</ol>;
}

export default function ProtocolsPage() {
  const protocols = (useQuery((api as any).protocols.list, {}) as Protocol[] | undefined) ?? [];
  const runs = (useQuery((api as any).protocols.listRuns, {}) as ProtocolRun[] | undefined) ?? [];
  const analytics = useQuery((api as any).protocols.analytics, {}) as any;
  const create = useMutation((api as any).protocols.create);
  const run = useMutation((api as any).protocols.run);
  const seedTemplates = useMutation((api as any).protocols.createTemplateSet);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const [name, setName] = useState("Daily Ops Triage");
  const [objective, setObjective] = useState("Triage work, unblock critical tasks, and report next actions.");
  const [definitionOfDone, setDefinitionOfDone] = useState("Priorities updated and summary posted.");
  const [requiredInputs, setRequiredInputs] = useState("Current task board\nInbox access");
  const [steps, setSteps] = useState("Check Now/Next/Blocked\nCheck inbox mentions\nUpdate priorities\nSend summary");
  const [providedInputs, setProvidedInputs] = useState("Current task board\nInbox access");

  const protocolLookup = useMemo(() => new Map(protocols.map((p) => [p._id, p.name])), [protocols]);

  return (
    <div className="wrap">
      <h1>Protocol Builder</h1>
      <p><small>Create reusable runbooks. Include Definition of Done and required inputs to enforce execution quality.</small></p>
      <div className="head"><button onClick={() => void seedTemplates({ now: new Date().toISOString() })}>Seed Templates</button></div>
      <div className="col">
        <label><small>Protocol Name</small></label>
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Protocol name" style={{width:"100%",marginBottom:8}} />

        <label><small>Objective</small></label>
        <textarea value={objective} onChange={(e)=>setObjective(e.target.value)} placeholder="Objective" style={{width:"100%",marginBottom:8}} />

        <label><small>Definition of Done (DoD)</small></label>
        <textarea value={definitionOfDone} onChange={(e)=>setDefinitionOfDone(e.target.value)} placeholder="What proves this protocol is complete?" style={{width:"100%",marginBottom:8}} />

        <label><small>Required Inputs (one per line)</small></label>
        <textarea value={requiredInputs} onChange={(e)=>setRequiredInputs(e.target.value)} placeholder="e.g. Repo access" style={{width:"100%",height:90,marginBottom:8}} />

        <label><small>Steps (one per line)</small></label>
        <textarea value={steps} onChange={(e)=>setSteps(e.target.value)} placeholder="One step per line" style={{width:"100%",height:120,marginBottom:8}} />

        <button onClick={() => void create({
          name,
          trigger: "manual",
          objective,
          definitionOfDone,
          requiredInputs: requiredInputs.split("\n").map(s => s.trim()).filter(Boolean),
          steps: steps.split("\n").map(s => s.trim()).filter(Boolean),
          approvalsRequired: true,
          templateCategory: "custom",
          now: new Date().toISOString(),
        })}>Create Protocol</button>
      </div>

      <h3 style={{marginTop:16}}>Protocol Analytics</h3>
      {analytics ? (
        <div className="card">
          <div>Total runs: {analytics.totals.total}</div>
          <div>Success: {analytics.totals.success}</div>
          <div>Failed: {analytics.totals.failed}</div>
          <div>Success rate: {analytics.totals.successRate}%</div>
        </div>
      ) : <div className="card">Loading analytics…</div>}

      <h3 style={{marginTop:16}}>Protocols</h3>
      {protocols.map((p) => (
        <div className="card" key={p._id}>
          <strong>{p.name}</strong> <small>({p.trigger}) • approvals: {p.approvalsRequired ? "required" : "not required"} • category: {(p as any).templateCategory ?? "custom"}</small>
          <div>{p.objective}</div>
          <div><small>DoD:</small> {(p as any).definitionOfDone ?? "n/a"}</div>
          <div><small>Required Inputs:</small> {((p as any).requiredInputs ?? []).join(", ") || "none"}</div>
          <ol>{p.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          <label><small>Provided Inputs for run (one per line)</small></label>
          <textarea value={providedInputs} onChange={(e)=>setProvidedInputs(e.target.value)} style={{width:"100%",height:70,marginBottom:8}} />
          <div style={{display:"flex",gap:8}}>
            <button onClick={() => void run({ protocolId: p._id, now: new Date().toISOString(), providedInputs: providedInputs.split("\n").map(s=>s.trim()).filter(Boolean) })}>Run (no approval)</button>
            <button onClick={() => void run({ protocolId: p._id, now: new Date().toISOString(), approvalGranted: true, providedInputs: providedInputs.split("\n").map(s=>s.trim()).filter(Boolean) })}>Run (approved)</button>
          </div>
        </div>
      ))}

      <h3 style={{marginTop:16}}>Run History</h3>
      {runs.map((r) => (
        <div className="card" key={r._id}>
          <small>{r.startedAt}</small> — <strong>{protocolLookup.get(r.protocolId) ?? r.protocolId}</strong> — {r.status} — {r.output ?? r.error ?? ""}
          <div><button onClick={() => setExpandedRunId(expandedRunId === r._id ? null : r._id)}>{expandedRunId === r._id ? "Hide" : "Show"} step detail</button></div>
          {expandedRunId === r._id ? <RunSteps runId={r._id} /> : null}
        </div>
      ))}
    </div>
  );
}
