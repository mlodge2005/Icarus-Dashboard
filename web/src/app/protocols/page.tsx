"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Protocol, ProtocolRun } from "@/lib/models";

function RunSteps({ runId }: { runId: string }) {
  const steps = (useQuery(api.protocols.runSteps, { runId: runId as any }) as any[] | undefined) ?? [];
  return <ol>{steps.map((s) => <li key={s._id}><small>#{s.stepIndex + 1}</small> {s.stepText} — {s.status}</li>)}</ol>;
}

export default function ProtocolsPage() {
  const protocols = (useQuery(api.protocols.list, {}) as Protocol[] | undefined) ?? [];
  const runs = (useQuery(api.protocols.listRuns, {}) as ProtocolRun[] | undefined) ?? [];
  const create = useMutation(api.protocols.create);
  const run = useMutation(api.protocols.run);
  const seedTemplates = useMutation(api.protocols.createTemplateSet);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

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
      {msg ? <small>{msg}</small> : null}
      <div className="head"><button onClick={async ()=>{try{await seedTemplates({ now: new Date().toISOString() }); setMsg("Templates seeded.");}catch(e){setMsg((e as Error).message)}}}>Seed Templates</button></div>
      <div className="col">
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Protocol name" style={{width:"100%",marginBottom:8}} />
        <textarea value={objective} onChange={(e)=>setObjective(e.target.value)} placeholder="Objective" style={{width:"100%",marginBottom:8}} />
        <textarea value={definitionOfDone} onChange={(e)=>setDefinitionOfDone(e.target.value)} placeholder="Definition of done" style={{width:"100%",marginBottom:8}} />
        <textarea value={requiredInputs} onChange={(e)=>setRequiredInputs(e.target.value)} placeholder="Required inputs (one per line)" style={{width:"100%",height:80,marginBottom:8}} />
        <textarea value={steps} onChange={(e)=>setSteps(e.target.value)} placeholder="Steps (one per line)" style={{width:"100%",height:100,marginBottom:8}} />
        <button onClick={async ()=>{try{await create({ name, trigger:"manual", objective, definitionOfDone, requiredInputs: requiredInputs.split("\n").map(s=>s.trim()).filter(Boolean), steps:steps.split("\n").map(s=>s.trim()).filter(Boolean), approvalsRequired:true, templateCategory:"custom", now:new Date().toISOString() }); setMsg("Protocol created.");}catch(e){setMsg(`Create failed: ${(e as Error).message}`)}}}>Create Protocol</button>
      </div>

      <h3 style={{marginTop:16}}>Protocols</h3>
      {protocols.length===0 ? <div className="card">No protocols yet. Create one or seed templates.</div> : null}
      {protocols.map((p) => (
        <div className="card" key={p._id}>
          <strong>{p.name}</strong><div>{p.objective}</div>
          <textarea value={providedInputs} onChange={(e)=>setProvidedInputs(e.target.value)} style={{width:"100%",height:60,marginBottom:8}} />
          <button onClick={async ()=>{try{await run({ protocolId:p._id as any, now:new Date().toISOString(), providedInputs:providedInputs.split("\n").map(s=>s.trim()).filter(Boolean), approvalGranted:true }); setMsg("Protocol run started.");}catch(e){setMsg(`Run failed: ${(e as Error).message}`)}}}>Run Approved</button>
        </div>
      ))}

      <h3 style={{marginTop:16}}>Run History</h3>
      {runs.map((r) => <div className="card" key={r._id}><small>{r.startedAt}</small> — <strong>{protocolLookup.get(r.protocolId) ?? r.protocolId}</strong> — {r.status}<div><button onClick={() => setExpandedRunId(expandedRunId === r._id ? null : r._id)}>{expandedRunId === r._id ? "Hide" : "Show"} steps</button></div>{expandedRunId===r._id?<RunSteps runId={r._id} />:null}</div>)}
    </div>
  );
}
