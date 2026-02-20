"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Protocol, ProtocolRun } from "@/lib/models";

function RunSteps({ runId }: { runId: string }) {
  const steps = (useQuery(api.protocols.runSteps, { runId: runId as any }) as any[] | undefined) ?? [];
  return <ol>{steps.map((s) => <li key={s._id}><small>#{s.stepIndex + 1}</small> {s.stepText} — {s.status}</li>)}</ol>;
}

const weekdayOptions = ["sun","mon","tue","wed","thu","fri","sat"] as const;

export default function ProtocolsPage() {
  const protocols = (useQuery(api.protocols.list, {}) as Protocol[] | undefined) ?? [];
  const runs = (useQuery(api.protocols.listRuns, {}) as ProtocolRun[] | undefined) ?? [];
  const create = useMutation(api.protocols.create as any);
  const run = useMutation(api.protocols.run as any);
  const update = useMutation(api.protocols.update as any);
  const setActive = useMutation(api.protocols.setActive as any);
  const remove = useMutation(api.protocols.remove as any);
  const seedTemplates = useMutation(api.protocols.createTemplateSet as any);

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
  const [scheduleMode, setScheduleMode] = useState<"interval"|"weekly">("interval");
  const [scheduleIntervalMinutes, setScheduleIntervalMinutes] = useState("60");
  const [scheduleWeekday, setScheduleWeekday] = useState<"sun"|"mon"|"tue"|"wed"|"thu"|"fri"|"sat">("thu");
  const [scheduleTime, setScheduleTime] = useState("12:01");
  const [scheduleTimezone, setScheduleTimezone] = useState("America/Chicago");

  const protocolLookup = useMemo(() => new Map(protocols.map((p) => [p._id, p.name])), [protocols]);

  const [editName, setEditName] = useState("");
  const [editObjective, setEditObjective] = useState("");
  const [editDod, setEditDod] = useState("");
  const [editRequired, setEditRequired] = useState("");
  const [editSteps, setEditSteps] = useState("");
  const [editTrigger, setEditTrigger] = useState<"manual"|"schedule"|"event">("manual");
  const [editAllowNoInput, setEditAllowNoInput] = useState(false);
  const [editScheduleEnabled, setEditScheduleEnabled] = useState(false);
  const [editScheduleMode, setEditScheduleMode] = useState<"interval"|"weekly">("interval");
  const [editScheduleIntervalMinutes, setEditScheduleIntervalMinutes] = useState("60");
  const [editScheduleWeekday, setEditScheduleWeekday] = useState<"sun"|"mon"|"tue"|"wed"|"thu"|"fri"|"sat">("thu");
  const [editScheduleTime, setEditScheduleTime] = useState("12:01");
  const [editScheduleTimezone, setEditScheduleTimezone] = useState("America/Chicago");

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
    setEditScheduleMode((p.scheduleMode as any) ?? "interval");
    setEditScheduleIntervalMinutes(String(p.scheduleIntervalMinutes ?? 60));
    setEditScheduleWeekday((p.scheduleWeekday as any) ?? "thu");
    setEditScheduleTime(p.scheduleTime ?? "12:01");
    setEditScheduleTimezone(p.scheduleTimezone ?? "America/Chicago");
  };

  return (
    <div className="wrap">
      <h1>Protocol Builder</h1>
      <p><small>Schedule by interval or weekly day/time/timezone. Scheduler checks every 10 minutes.</small></p>
      {msg ? <small>{msg}</small> : null}
      <div className="head"><button onClick={async ()=>{try{await seedTemplates({ now: new Date().toISOString() }); setMsg("Templates seeded.");}catch(e){setMsg((e as Error).message)}}}>Seed Templates</button></div>
      <div className="col">
        <label><small>Name</small></label><input value={name} onChange={(e)=>setName(e.target.value)} />
        <label><small>Objective</small></label><textarea value={objective} onChange={(e)=>setObjective(e.target.value)} />
        <label><small>Definition of Done</small></label><textarea value={definitionOfDone} onChange={(e)=>setDefinitionOfDone(e.target.value)} />
        <label><small>Trigger</small></label>
        <select value={trigger} onChange={(e)=>setTrigger(e.target.value as any)}><option value="manual">manual</option><option value="schedule">schedule</option><option value="event">event</option></select>
        <div style={{display:"flex", gap:12, margin:"8px 0", flexWrap:"wrap"}}>
          <label><input type="checkbox" checked={allowNoInput} onChange={(e)=>setAllowNoInput(e.target.checked)} /> Allow no input</label>
          <label><input type="checkbox" checked={scheduleEnabled} onChange={(e)=>setScheduleEnabled(e.target.checked)} /> Recurring schedule enabled</label>
          <select value={scheduleMode} onChange={(e)=>setScheduleMode(e.target.value as any)}>
            <option value="interval">Interval</option>
            <option value="weekly">Weekly (day/time/timezone)</option>
          </select>
          {scheduleMode === "interval" ? (
            <select value={scheduleIntervalMinutes} onChange={(e)=>setScheduleIntervalMinutes(e.target.value)} style={{width:180}}>
              <option value="10">Every 10 minutes</option><option value="15">Every 15 minutes</option><option value="30">Every 30 minutes</option><option value="60">Hourly</option><option value="360">Every 6 hours</option><option value="720">Every 12 hours</option><option value="1440">Daily</option><option value="10080">Weekly</option><option value="44640">Monthly (~31 days)</option>
            </select>
          ) : (
            <>
              <select value={scheduleWeekday} onChange={(e)=>setScheduleWeekday(e.target.value as any)} style={{width:120}}>{weekdayOptions.map((d)=><option key={d} value={d}>{d}</option>)}</select>
              <input value={scheduleTime} onChange={(e)=>setScheduleTime(e.target.value)} placeholder="HH:MM" style={{width:120}} />
              <input value={scheduleTimezone} onChange={(e)=>setScheduleTimezone(e.target.value)} placeholder="America/Chicago" style={{width:220}} />
            </>
          )}
        </div>
        <label><small>Required Inputs (one per line)</small></label><textarea value={requiredInputs} onChange={(e)=>setRequiredInputs(e.target.value)} style={{height:80}} />
        <label><small>Steps (one per line)</small></label><textarea value={steps} onChange={(e)=>setSteps(e.target.value)} style={{height:100}} />
        <button onClick={async ()=>{try{await create({ name, trigger, objective, definitionOfDone, requiredInputs: requiredInputs.split("\n").map(s=>s.trim()).filter(Boolean), steps:steps.split("\n").map(s=>s.trim()).filter(Boolean), approvalsRequired:true, allowNoInput, scheduleEnabled, scheduleMode, scheduleIntervalMinutes: Math.max(10, Math.min(44640, Number(scheduleIntervalMinutes || "60"))), scheduleWeekday, scheduleTime, scheduleTimezone, templateCategory:"custom", now:new Date().toISOString() }); setMsg("Protocol created.");}catch(e){setMsg(`Create failed: ${(e as Error).message}`)}}}>Create Protocol</button>
      </div>

      <h3 style={{marginTop:16}}>Protocols</h3>
      {protocols.map((p) => (
        <div className="card" key={p._id}>
          <strong>{p.name}</strong> <small>({p.active ? "active" : "paused"})</small> <small>trigger={p.trigger}</small>
          <div>{p.objective}</div>
          <div><small>No input:</small> {p.allowNoInput ? "yes" : "no"} · <small>Schedule:</small> {p.scheduleEnabled ? ((p.scheduleMode ?? "interval") === "weekly" ? `${p.scheduleWeekday ?? "thu"} ${p.scheduleTime ?? "12:01"} ${p.scheduleTimezone ?? "America/Chicago"}` : `every ${p.scheduleIntervalMinutes ?? "?"} min`) : "off"}</div>
          <div style={{display:"flex",gap:8,margin:"8px 0"}}>
            <button onClick={async ()=>{try{await setActive({id:p._id as any,active:!p.active,now:new Date().toISOString()});setMsg(p.active?"Protocol paused.":"Protocol resumed.");}catch(e){setMsg((e as Error).message)}}}>{p.active?"Pause":"Resume"}</button>
            <button onClick={()=>openEdit(p)}>Edit</button>
            <button onClick={async ()=>{try{await remove({id:p._id as any,now:new Date().toISOString()});setMsg("Protocol deleted.");}catch(e){setMsg((e as Error).message)}}}>Delete</button>
          </div>
          {!p.allowNoInput ? <><label><small>Provided inputs for run (one per line)</small></label><textarea value={providedInputs} onChange={(e)=>setProvidedInputs(e.target.value)} style={{height:60}} /></> : null}
          <button disabled={!p.active} onClick={async ()=>{try{await run({ protocolId:p._id as any, now:new Date().toISOString(), providedInputs:p.allowNoInput?[]:providedInputs.split("\n").map(s=>s.trim()).filter(Boolean), approvalGranted:true }); setMsg("Protocol run started.");}catch(e){setMsg(`Run failed: ${(e as Error).message}`)}}}>Run Approved</button>
        </div>
      ))}

      {editing ? (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",display:"grid",placeItems:"center",zIndex:50}}>
          <div className="col" style={{width:"min(760px, 92vw)",maxHeight:"85vh",overflow:"auto"}}>
            <h3>Edit Protocol</h3>
            <label><small>Name</small></label><input value={editName} onChange={(e)=>setEditName(e.target.value)} />
            <label><small>Objective</small></label><textarea value={editObjective} onChange={(e)=>setEditObjective(e.target.value)} />
            <label><small>Definition of Done</small></label><textarea value={editDod} onChange={(e)=>setEditDod(e.target.value)} />
            <label><small>Trigger</small></label>
            <select value={editTrigger} onChange={(e)=>setEditTrigger(e.target.value as any)}><option value="manual">manual</option><option value="schedule">schedule</option><option value="event">event</option></select>
            <div style={{display:"flex", gap:12, margin:"8px 0", flexWrap:"wrap"}}>
              <label><input type="checkbox" checked={editAllowNoInput} onChange={(e)=>setEditAllowNoInput(e.target.checked)} /> Allow no input</label>
              <label><input type="checkbox" checked={editScheduleEnabled} onChange={(e)=>setEditScheduleEnabled(e.target.checked)} /> Recurring schedule enabled</label>
              <select value={editScheduleMode} onChange={(e)=>setEditScheduleMode(e.target.value as any)}><option value="interval">Interval</option><option value="weekly">Weekly</option></select>
              {editScheduleMode === "interval" ? (
                <select value={editScheduleIntervalMinutes} onChange={(e)=>setEditScheduleIntervalMinutes(e.target.value)} style={{width:180}}><option value="10">Every 10 minutes</option><option value="15">Every 15 minutes</option><option value="30">Every 30 minutes</option><option value="60">Hourly</option><option value="360">Every 6 hours</option><option value="720">Every 12 hours</option><option value="1440">Daily</option><option value="10080">Weekly</option><option value="44640">Monthly (~31 days)</option></select>
              ) : (
                <>
                  <select value={editScheduleWeekday} onChange={(e)=>setEditScheduleWeekday(e.target.value as any)} style={{width:120}}>{weekdayOptions.map((d)=><option key={d} value={d}>{d}</option>)}</select>
                  <input value={editScheduleTime} onChange={(e)=>setEditScheduleTime(e.target.value)} placeholder="HH:MM" style={{width:120}} />
                  <input value={editScheduleTimezone} onChange={(e)=>setEditScheduleTimezone(e.target.value)} placeholder="America/Chicago" style={{width:220}} />
                </>
              )}
            </div>
            <label><small>Required Inputs</small></label><textarea value={editRequired} onChange={(e)=>setEditRequired(e.target.value)} style={{height:80}} />
            <label><small>Steps</small></label><textarea value={editSteps} onChange={(e)=>setEditSteps(e.target.value)} style={{height:110}} />
            <div style={{display:"flex",gap:8}}>
              <button onClick={async ()=>{try{await update({id:editing._id as any,name:editName,objective:editObjective,definitionOfDone:editDod,requiredInputs:editRequired.split("\n").map(s=>s.trim()).filter(Boolean),steps:editSteps.split("\n").map(s=>s.trim()).filter(Boolean),trigger:editTrigger,allowNoInput:editAllowNoInput,scheduleEnabled:editScheduleEnabled,scheduleMode:editScheduleMode,scheduleIntervalMinutes:Math.max(10, Math.min(44640, Number(editScheduleIntervalMinutes||"60"))),scheduleWeekday:editScheduleWeekday,scheduleTime:editScheduleTime,scheduleTimezone:editScheduleTimezone,now:new Date().toISOString()});setMsg("Protocol updated.");setEditing(null);}catch(e){setMsg((e as Error).message)}}}>Save</button>
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
