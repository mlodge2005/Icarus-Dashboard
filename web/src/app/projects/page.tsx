"use client";
import { useState } from "react";
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
  const removeProject = useMutation(api.projects.remove as any);
  const buildPlan = useMutation(api.projects.buildPlan as any);
  const runTick = useMutation(api.projects.runTick as any);

  const [msg, setMsg] = useState("");
  const [name, setName] = useState("New Project");
  const [outcome, setOutcome] = useState("Desired business/technical outcome");
  const [specs, setSpecs] = useState("- Define scope\n- Build feature\n- Validate outcomes");
  const [dod, setDod] = useState("Done means outcome delivered and validated.");
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const openProject = projects.find((p) => p._id === openId) ?? null;
  const artifacts = (useQuery(api.projects.artifactsByProject as any, openProject ? { projectId: openProject._id } : "skip") as any[] | undefined) ?? [];
  const steps = (useQuery(api.projects.stepsByProject as any, openProject ? { projectId: openProject._id } : "skip") as any[] | undefined) ?? [];

  const onUpload = async (projectId: string, file: File | null) => {
    if (!file) return;
    const allowed = ["text/plain", "text/markdown", "image/png"];
    const extOk = /\.(txt|md|png)$/i.test(file.name);
    if (!allowed.includes(file.type) || !extOk) {
      setMsg("Upload blocked: only .txt, .md, .png are allowed.");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("Failed to read file"));
      r.readAsDataURL(file);
    });
    try {
      await addArtifact({ projectId, fileName: file.name, fileType: file.type as any, dataUrl, now: new Date().toISOString() });
      setMsg("Artifact uploaded.");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <div className="wrap">
      <h1>Projects</h1>
      <p><small>Phase 2: click a project to expand inline details, plan steps, and upload artifacts (.txt/.md/.png).</small></p>
      {msg ? <small>{msg}</small> : null}

      <div className="card">
        <strong>Global Mode:</strong> {execState?.mode ?? "running"}
        <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
          <button onClick={async()=>{try{await setMode({mode:"running",now:new Date().toISOString()});setMsg("Global mode set to running.");}catch(e){setMsg((e as Error).message)}}}>Resume Queue</button>
          <button onClick={async()=>{try{await setMode({mode:"paused",now:new Date().toISOString()});setMsg("Global mode paused.");}catch(e){setMsg((e as Error).message)}}}>Pause All</button>
          <button onClick={async()=>{try{await activateNext({now:new Date().toISOString()});setMsg("Activated next queued project.");}catch(e){setMsg((e as Error).message)}}}>Activate Next</button>
          <button onClick={async()=>{try{await runTick({now:new Date().toISOString()});setMsg("Execution tick complete.");}catch(e){setMsg((e as Error).message)}}}>Run Tick</button>
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
      <div className="card"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search projects" style={{width:"100%"}} /></div>
      {projects.filter((p)=> (p.name||"").toLowerCase().includes(search.toLowerCase()) || (p.outcome||"").toLowerCase().includes(search.toLowerCase())).map((p)=> {
        const isOpen = openId === p._id;
        return (
          <div className="card" key={p._id}>
            <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
              <div><strong>{p.name}</strong> — <small>{p.status ?? "inactive"}</small></div>
              <button onClick={()=>setOpenId(isOpen ? null : p._id)}>{isOpen ? "Close" : "Open"}</button>
            </div>
            <div><small>Outcome:</small> {p.outcome ?? "n/a"}</div>
            <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
              <button onClick={async()=>{try{await enqueue({id:p._id,now:new Date().toISOString()});setMsg("Project queued.");}catch(e){setMsg((e as Error).message)}}}>Queue</button>
              <button onClick={async()=>{try{await setInactive({id:p._id,now:new Date().toISOString()});setMsg("Project set inactive.");}catch(e){setMsg((e as Error).message)}}}>Inactive</button>
              <button onClick={async()=>{try{await setBlocked({id:p._id,blockerReason:"needs_approval",blockerDetails:"Awaiting operator approval",now:new Date().toISOString()});setMsg("Project blocked + global paused.");}catch(e){setMsg((e as Error).message)}}}>Block</button>
              <button onClick={async()=>{try{await resolveBlocked({id:p._id,now:new Date().toISOString()});setMsg("Project unblocked and queued.");}catch(e){setMsg((e as Error).message)}}}>Unblock</button>
              <button onClick={async()=>{try{await buildPlan({id:p._id,now:new Date().toISOString()});setMsg("Plan built from specs.");}catch(e){setMsg((e as Error).message)}}}>Build Plan</button>
              <button onClick={async()=>{try{await removeProject({id:p._id,now:new Date().toISOString()});setMsg("Project deleted."); if(openId===p._id) setOpenId(null);}catch(e){setMsg((e as Error).message)}}}>Delete</button>
            </div>

            {isOpen ? (
              <div style={{marginTop:10,borderTop:"1px solid #eee",paddingTop:10}}>
                <p><small>Inline project details (expand/collapse). Edit instructions and upload artifacts.</small></p>
                <textarea defaultValue={p.outcome ?? ""} id={`outcome-${p._id}`} style={{width:"100%",marginTop:8}} placeholder="Outcome" />
                <textarea defaultValue={p.specs ?? ""} id={`specs-${p._id}`} style={{width:"100%",marginTop:8,height:120}} placeholder="Specs" />
                <textarea defaultValue={p.definitionOfDone ?? ""} id={`dod-${p._id}`} style={{width:"100%",marginTop:8}} placeholder="Definition of done" />
                <textarea defaultValue={p.nextAction ?? ""} id={`next-${p._id}`} style={{width:"100%",marginTop:8}} placeholder="Next action" />
                <button onClick={async()=>{try{const outcomeVal=(document.getElementById(`outcome-${p._id}`) as HTMLTextAreaElement).value; const specsVal=(document.getElementById(`specs-${p._id}`) as HTMLTextAreaElement).value; const dodVal=(document.getElementById(`dod-${p._id}`) as HTMLTextAreaElement).value; const nextVal=(document.getElementById(`next-${p._id}`) as HTMLTextAreaElement).value; await update({id:p._id,outcome:outcomeVal,specs:specsVal,definitionOfDone:dodVal,nextAction:nextVal,now:new Date().toISOString()}); setMsg("Project instructions updated.");}catch(e){setMsg((e as Error).message)}}}>Save Instructions</button>

                <h4 style={{marginTop:12}}>Plan Steps</h4>
                {steps.length===0 ? <div><small>No steps yet. Click Build Plan.</small></div> : steps.map((s:any)=><div key={s._id}><small>#{s.stepIndex+1}</small> {s.text} — {s.status}</div>)}

                <h4 style={{marginTop:12}}>Document Upload</h4>
                <p><small>Allowed file types: .txt, .md, .png</small></p>
                <input type="file" accept=".txt,.md,.png,text/plain,text/markdown,image/png" onChange={(e)=>void onUpload(p._id, e.target.files?.[0] ?? null)} />
                {artifacts.map((a)=> <div className="card" key={a._id}><strong>{a.fileName}</strong> <small>({a.fileType})</small><div><a href={a.dataUrl} download={a.fileName}>Download</a></div><small>{a.note ?? ""}</small></div>)}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  );
}
