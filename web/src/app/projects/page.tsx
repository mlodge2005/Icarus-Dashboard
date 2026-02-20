"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function Projects() {
  const projects = (useQuery(api.projects.list as any, {}) as any[] | undefined) ?? [];
  const execState = useQuery(api.projects.getExecutionState as any, {}) as any;
  const queue = (useQuery(api.projects.listQueue as any, {}) as any[] | undefined) ?? [];

  const create = useMutation(api.projects.create as any);
  const update = useMutation(api.projects.update as any);
  const enqueue = useMutation(api.projects.enqueue as any);
  const activateNext = useMutation(api.projects.activateNext as any);
  const setMode = useMutation(api.projects.setMode as any);
  const setBlocked = useMutation(api.projects.setBlocked as any);
  const resolveBlocked = useMutation(api.projects.resolveBlocked as any);
  const setInactive = useMutation(api.projects.setInactive as any);
  const addArtifact = useMutation(api.projects.addArtifact as any);

  const [msg, setMsg] = useState("");
  const [name, setName] = useState("New Project");
  const [outcome, setOutcome] = useState("Desired business/technical outcome");
  const [specs, setSpecs] = useState("Detailed specs, constraints, acceptance criteria.");
  const [dod, setDod] = useState("Done means outcome delivered and validated.");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const activeProject = useMemo(() => projects.find((p) => p.status === "active") ?? null, [projects]);
  const selected = projects.find((p) => p._id === activeProjectId) ?? activeProject ?? projects[0] ?? null;
  const artifacts = (useQuery(api.projects.artifactsByProject as any, selected ? { projectId: selected._id } : "skip") as any[] | undefined) ?? [];

  const [artifactTitle, setArtifactTitle] = useState("Spec Artifact");
  const [artifactUrl, setArtifactUrl] = useState("");
  const [artifactNote, setArtifactNote] = useState("");

  return (
    <div className="wrap">
      <h1>Projects</h1>
      <p><small>Execution engine: one active project max, queued projects wait, paused mode stops queue execution.</small></p>
      {msg ? <small>{msg}</small> : null}

      <div className="card">
        <strong>Global Mode:</strong> {execState?.mode ?? "running"}
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <button onClick={async()=>{try{await setMode({mode:"running",now:new Date().toISOString()});setMsg("Global mode set to running.");}catch(e){setMsg((e as Error).message)}}}>Resume Queue</button>
          <button onClick={async()=>{try{await setMode({mode:"paused",now:new Date().toISOString()});setMsg("Global mode paused.");}catch(e){setMsg((e as Error).message)}}}>Pause All</button>
          <button onClick={async()=>{try{await activateNext({now:new Date().toISOString()});setMsg("Activated next queued project.");}catch(e){setMsg((e as Error).message)}}}>Activate Next</button>
        </div>
      </div>

      <div className="card" style={{marginTop:10}}>
        <strong>Create Project</strong>
        <input value={name} onChange={(e)=>setName(e.target.value)} style={{width:"100%",marginTop:8}} placeholder="Project name" />
        <textarea value={outcome} onChange={(e)=>setOutcome(e.target.value)} style={{width:"100%",marginTop:8}} placeholder="Outcome" />
        <textarea value={specs} onChange={(e)=>setSpecs(e.target.value)} style={{width:"100%",marginTop:8,height:100}} placeholder="Specs" />
        <textarea value={dod} onChange={(e)=>setDod(e.target.value)} style={{width:"100%",marginTop:8}} placeholder="Definition of done" />
        <button onClick={async()=>{try{await create({name, outcome, specs, definitionOfDone:dod, now:new Date().toISOString()});setMsg("Project created.");}catch(e){setMsg((e as Error).message)}}}>Create</button>
      </div>

      <h3 style={{marginTop:16}}>Queue</h3>
      {queue.length===0 ? <div className="card">Queue empty</div> : queue.map((q)=> <div className="card" key={q._id}>#{q.queuePosition ?? "?"} {q.name}</div>)}

      <h3 style={{marginTop:16}}>All Projects</h3>
      {projects.map((p)=> (
        <div className="card" key={p._id}>
          <strong>{p.name}</strong> — <small>{p.status}</small>
          <div><small>Outcome:</small> {p.outcome ?? "n/a"}</div>
          <div><small>Next:</small> {p.nextAction ?? "n/a"}</div>
          {p.blockerReason ? <div><small>Blocked:</small> {p.blockerReason} {p.blockerDetails ? `- ${p.blockerDetails}` : ""}</div> : null}
          <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
            <button onClick={()=>setActiveProjectId(p._id)}>Open</button>
            <button onClick={async()=>{try{await enqueue({id:p._id,now:new Date().toISOString()});setMsg("Project queued.");}catch(e){setMsg((e as Error).message)}}}>Queue</button>
            <button onClick={async()=>{try{await setInactive({id:p._id,now:new Date().toISOString()});setMsg("Project set inactive.");}catch(e){setMsg((e as Error).message)}}}>Inactive</button>
            <button onClick={async()=>{try{await setBlocked({id:p._id,blockerReason:"needs_approval",blockerDetails:"Awaiting operator approval",now:new Date().toISOString()});setMsg("Project blocked + global paused.");}catch(e){setMsg((e as Error).message)}}}>Block</button>
            <button onClick={async()=>{try{await resolveBlocked({id:p._id,now:new Date().toISOString()});setMsg("Project unblocked and queued.");}catch(e){setMsg((e as Error).message)}}}>Unblock</button>
          </div>
        </div>
      ))}

      {selected ? (
        <div className="card" style={{marginTop:16}}>
          <h3>Project Detail: {selected.name}</h3>
          <p><small>Edit outcome/specs/instructions. This is the source of truth for execution.</small></p>
          <textarea defaultValue={selected.outcome ?? ""} id="outcomeField" style={{width:"100%",marginTop:8}} placeholder="Outcome" />
          <textarea defaultValue={selected.specs ?? ""} id="specsField" style={{width:"100%",marginTop:8,height:120}} placeholder="Specs" />
          <textarea defaultValue={selected.definitionOfDone ?? ""} id="dodField" style={{width:"100%",marginTop:8}} placeholder="Definition of done" />
          <textarea defaultValue={selected.nextAction ?? ""} id="nextField" style={{width:"100%",marginTop:8}} placeholder="Next action" />
          <button onClick={async()=>{try{const outcomeVal=(document.getElementById('outcomeField') as HTMLTextAreaElement).value; const specsVal=(document.getElementById('specsField') as HTMLTextAreaElement).value; const dodVal=(document.getElementById('dodField') as HTMLTextAreaElement).value; const nextVal=(document.getElementById('nextField') as HTMLTextAreaElement).value; await update({id:selected._id,outcome:outcomeVal,specs:specsVal,definitionOfDone:dodVal,nextAction:nextVal,now:new Date().toISOString()}); setMsg("Project instructions updated.");}catch(e){setMsg((e as Error).message)}}}>Save Instructions</button>

          <h4 style={{marginTop:12}}>Artifacts</h4>
          <p><small>Attach spec docs, links, and notes to this project.</small></p>
          <input value={artifactTitle} onChange={(e)=>setArtifactTitle(e.target.value)} placeholder="Artifact title" style={{width:"100%"}} />
          <input value={artifactUrl} onChange={(e)=>setArtifactUrl(e.target.value)} placeholder="Artifact URL (optional)" style={{width:"100%",marginTop:8}} />
          <textarea value={artifactNote} onChange={(e)=>setArtifactNote(e.target.value)} placeholder="Artifact note" style={{width:"100%",marginTop:8}} />
          <button onClick={async()=>{try{await addArtifact({projectId:selected._id,title:artifactTitle,url:artifactUrl||undefined,note:artifactNote||undefined,now:new Date().toISOString()}); setMsg("Artifact added."); setArtifactUrl(""); setArtifactNote("");}catch(e){setMsg((e as Error).message)}}}>Add Artifact</button>
          {artifacts.map((a)=> <div className="card" key={a._id}><strong>{a.title}</strong><div>{a.url ? <a href={a.url} target="_blank">{a.url}</a> : null}</div><small>{a.note ?? ""}</small></div>)}
        </div>
      ) : null}
    </div>
  );
}
