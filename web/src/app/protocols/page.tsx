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
  const update = useMutation(api.protocols.update);
  const setActive = useMutation(api.protocols.setActive);
  const remove = useMutation(api.protocols.remove);
  const seedTemplates = useMutation(api.protocols.createTemplateSet);

  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<Protocol | null>(null);

  const [name, setName] = useState("Daily Ops Triage");
  const [objective, setObjective] = useState("Triage work, unblock critical tasks, and report next actions.");
  const [definitionOfDone, setDefinitionOfDone] = useState("Priorities updated and summary posted.");
  const [requiredInputs, setRequiredInputs] = useState("Current task board\nInbox access");
  const [steps, setSteps] = useState("Check Now/Next/Blocked\nCheck inbox mentions\nUpdate priorities\nSend summary");
  const [providedInputs, setProvidedInputs] = useState("Current task board\nInbox access");
  const [trigger, setTrigger] = useState<"manual"|"schedule"|"event">("manual");
  const [allowNoInput, setAllowNoInput] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleIntervalMinutes, setScheduleIntervalMinutes] = useState("60");
  const protocolLookup = useMemo(() => new Map(protocols.map((p) => [p._id, p.name])), [protocols]);

  const [editName, setEditName] = useState("");
  const [editObjective, setEditObjective] = useState("");
  const [editDod, setEditDod] = useState("");
  const [editRequired, setEditRequired] = useState("");
  const [editSteps, setEditSteps] = useState("");
  const [editTrigger, setEditTrigger] = useState<"manual"|"schedule"|"event">("manual");
  const [editAllowNoInput, setEditAllowNoInput] = useState(false);
  const [editScheduleEnabled, setEditScheduleEnabled] = useState(false);
  const [editScheduleIntervalMinutes, setEditScheduleIntervalMinutes] = useState("60");

  const openEdit = (p: Protocol) => {
    setEditing(p);
    setEditName(p.name);
    setEditObjective(p.objective);
    setEditDod(p.definitionOfDone ?? "");
    setEditRequired((p.requiredInputs ?? []).join("\n"));
    setEditSteps((p.steps ?? []).join("\n"));
    setEditTrigger((p.trigger as any) ?? "manual");
    setEditAllowNoInput(!!p.allowNoInput);
    setEditScheduleEnabled(!!p.scheduleEnabled);
    setEditScheduleIntervalMinutes(String(p.scheduleIntervalMinutes ?? 60));
  };

  return (
    <div className="wrap">
      <h1>Protocol Builder</h1>
      <p><small>Create repeatable workflows. Supports recurring schedules + no-input mode.</small></p>
      {msg ? <small>{msg}</small> : null}
      <div className="head"><button onClick={async ()=>{try{await seedTemplates({ now: new Date().toISOString() }); setMsg("Templates seeded.");}catch(e){setMsg((e as Error).message)}}}>Seed Templates</button></div>
      <div className="col">
        <label><small>Name</small></label>
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Protocol name" style={{width:"100%",marginBottom:8}} />
        <label><small>Objective</small></label>
        <textarea value={objective} onChange={(e)=>setObjective(e.target.value)} placeholder="Objective" style={{width:"100%",marginBottom:8}} />
        <label><small>Definition of Done</small></label>
        <textarea value={definitionOfDone} onChange={(e)=>setDefinitionOfDone(e.target.value)} placeholder="Definition of done" style={{width:"100%",marginBottom:8}} />
        <label><small>Trigger</small></label>
        <select value={trigger} onChange={(e)=>setTrigger(e.target.value as any)} style={{marginBottom:8}}>
          <option value="manual">manual</option>
          <option value="schedule">schedule</option>
          <option value="event">event</option>
        </select>
        <div style={{display:"flex", gap:12, marginBottom:8}}>
          <label><input type="checkbox" checked={allowNoInput} onChange={(e)=>setAllowNoInput(e.target.checked)} /> Allow no input</label>
          <label><input type="checkbox" checked={scheduleEnabled} onChange={(e)=>setScheduleEnabled(e.target.checked)} /> Recurring schedule enabled</label>
          <input value={scheduleIntervalMinutes} onChange={(e)=>setScheduleIntervalMinutes(e.target.value)} style={{width:120}} placeholder="interval min" />
        </div>
        <label><small>Required Inputs (one per line)</small></label>
        <textarea value={requiredInputs} onChange={(e)=>setRequiredInputs(e.target.value)} placeholder="Required inputs" style={{width:"100%",height:80,marginBottom:8}} />
        <label><small>Steps (one per line)</small></label>
        <textarea value={steps} onChange={(e)=>setSteps(e.target.value)} placeholder="Steps" style={{width:"100%",height:100,marginBottom:8}} />
        <button onClick={async ()=>{try{await create({ name, trigger, objective, definitionOfDone, requiredInputs: requiredInputs.split("\n").map(s=>s.trim()).filter(Boolean), steps:steps.split("\n").map(s=>s.trim()).filter(Boolean), approvalsRequired:true, allowNoInput, scheduleEnabled, scheduleIntervalMinutes: Number(scheduleIntervalMinutes || "0") || undefined, templateCategory:"custom", now:new Date().toISOString() }); setMsg("Protocol created.");}catch(e){setMsg(`Create failed: ${(e as Error).message}`)}}}>Create Protocol</button>
      </div>

      <h3 style={{marginTop:16}}>Protocols</h3>
      {protocols.length===0 ? <div className="card">No protocols yet. Create one or seed templates.</div> : null}
      {protocols.map((p) => (
        <div className="card" key={p._id}>
          <strong>{p.name}</strong> <small>({p.active ? "active" : "paused"})</small> <small>trigger={p.trigger}</small>
          <div>{p.objective}</div>
          <div><small>No input:</small> {p.allowNoInput ? "yes" : "no"} · <small>Schedule:</small> {p.scheduleEnabled ? `every ${p.scheduleIntervalMinutes ?? "?"} min` : "off"}</div>
          <div style={{display:"flex",gap:8,margin:"8px 0"}}>
            <button onClick={async ()=>{try{await setActive({id:p._id as any,active:!p.active,now:new Date().toISOString()});setMsg(p.active?"Protocol paused.":"Protocol resumed.");}catch(e){setMsg((e as Error).message)}}}>{p.active?"Pause":"Resume"}</button>
            <button onClick={()=>openEdit(p)}>Edit</button>
            <button onClick={async ()=>{try{await remove({id:p._id as any,now:new Date().toISOString()});setMsg("Protocol deleted.");}catch(e){setMsg((e as Error).message)}}}>Delete</button>
          </div>
          {!p.allowNoInput ? <><label><small>Provided inputs for run (one per line)</small></label><textarea value={providedInputs} onChange={(e)=>setProvidedInputs(e.target.value)} style={{width:"100%",height:60,marginBottom:8}} /></> : null}
          <button disabled={!p.active} onClick={async ()=>{try{await run({ protocolId:p._id as any, now:new Date().toISOString(), providedInputs:p.allowNoInput?[]:providedInputs.split("\n").map(s=>s.trim()).filter(Boolean), approvalGranted:true }); setMsg("Protocol run started.");}catch(e){setMsg(`Run failed: ${(e as Error).message}`)}}}>Run Approved</button>
        </div>
      ))}

      {editing ? (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",display:"grid",placeItems:"center",zIndex:50}}>
          <div className="col" style={{width:"min(700px, 92vw)",maxHeight:"85vh",overflow:"auto"}}>
            <h3>Edit Protocol</h3>
            <label><small>Name</small></label>
            <input value={editName} onChange={(e)=>setEditName(e.target.value)} style={{width:"100%",marginBottom:8}} />
            <label><small>Objective</small></label>
            <textarea value={editObjective} onChange={(e)=>setEditObjective(e.target.value)} style={{width:"100%",marginBottom:8}} />
            <label><small>Definition of Done</small></label>
            <textarea value={editDod} onChange={(e)=>setEditDod(e.target.value)} style={{width:"100%",marginBottom:8}} />
            <label><small>Trigger</small></label>
            <select value={editTrigger} onChange={(e)=>setEditTrigger(e.target.value as any)} style={{marginBottom:8}}>
              <option value="manual">manual</option>
              <option value="schedule">schedule</option>
              <option value="event">event</option>
            </select>
            <div style={{display:"flex", gap:12, marginBottom:8}}>
              <label><input type="checkbox" checked={editAllowNoInput} onChange={(e)=>setEditAllowNoInput(e.target.checked)} /> Allow no input</label>
              <label><input type="checkbox" checked={editScheduleEnabled} onChange={(e)=>setEditScheduleEnabled(e.target.checked)} /> Recurring schedule enabled</label>
              <input value={editScheduleIntervalMinutes} onChange={(e)=>setEditScheduleIntervalMinutes(e.target.value)} style={{width:120}} placeholder="interval min" />
            </div>
            <label><small>Required Inputs</small></label>
            <textarea value={editRequired} onChange={(e)=>setEditRequired(e.target.value)} style={{width:"100%",height:80,marginBottom:8}} />
            <label><small>Steps</small></label>
            <textarea value={editSteps} onChange={(e)=>setEditSteps(e.target.value)} style={{width:"100%",height:110,marginBottom:8}} />
            <div style={{display:"flex",gap:8}}>
              <button onClick={async ()=>{try{await update({id:editing._id as any,name:editName,objective:editObjective,definitionOfDone:editDod,requiredInputs:editRequired.split("\n").map(s=>s.trim()).filter(Boolean),steps:editSteps.split("\n").map(s=>s.trim()).filter(Boolean),trigger:editTrigger,allowNoInput:editAllowNoInput,scheduleEnabled:editScheduleEnabled,scheduleIntervalMinutes:Number(editScheduleIntervalMinutes||"0")||undefined,now:new Date().toISOString()});setMsg("Protocol updated.");setEditing(null);}catch(e){setMsg((e as Error).message)}}}>Save</button>
              <button onClick={()=>setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}

      <h3 style={{marginTop:16}}>Run History</h3>
      {runs.map((r) => <div className="card" key={r._id}><small>{r.startedAt}</small> — <strong>{protocolLookup.get(r.protocolId) ?? r.protocolId}</strong> — {r.status}<div><button onClick={() => setExpandedRunId(expandedRunId === r._id ? null : r._id)}>{expandedRunId === r._id ? "Hide" : "Show"} steps</button></div>{expandedRunId===r._id?<RunSteps runId={r._id} />:null}</div>)}
    </div>
  );
}
