"use client";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function Documents() {
  const docs = (useQuery(api.documents.list, {}) as any[] | undefined) ?? [];
  const create = useMutation(api.documents.create);
  const [title, setTitle] = useState("Shared Artifact");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <div className="wrap">
      <h1>Documents Hub</h1>
      <p><small>Shared handoff space between you and Icarus for links, notes, and artifact references.</small></p>
      <label><small>Title</small></label>
      <input value={title} onChange={(e)=>setTitle(e.target.value)} style={{width:"100%"}} />
      <label><small>URL (optional)</small></label>
      <input value={url} onChange={(e)=>setUrl(e.target.value)} style={{width:"100%"}} placeholder="https://..." />
      <label><small>Note / instructions</small></label>
      <textarea value={note} onChange={(e)=>setNote(e.target.value)} style={{width:"100%",height:100}} />
      <button onClick={async ()=>{try{await create({title, url: url || undefined, note: note || undefined, now:new Date().toISOString()}); setMsg("Document saved."); setUrl(""); setNote("");}catch(e){setMsg(`Failed: ${(e as Error).message}`)}}}>Save to Hub</button>
      {msg ? <small>{msg}</small> : null}
      <h3 style={{marginTop:16}}>Items</h3>
      {docs.map((d)=><div className="card" key={d._id}><strong>{d.title}</strong><div>{d.url ? <a href={d.url} target="_blank">{d.url}</a> : null}</div><div><small>{d.note ?? ""}</small></div><small>{d.createdAt}</small></div>)}
    </div>
  );
}
