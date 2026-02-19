"use client";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function Content() {
  const items = (useQuery(api.content.list, {}) as any[] | undefined) ?? [];
  const create = useMutation(api.content.create);
  const [title, setTitle] = useState("New Content Idea");
  const [msg, setMsg] = useState("");
  return (
    <div className="wrap">
      <h1>Content Queue</h1>
      <p><small>Add ideas, drafts, and published items.</small></p>
      <input value={title} onChange={(e)=>setTitle(e.target.value)} />
      <button onClick={async ()=>{try{await create({title, platform:"general", hook:"", status:"ideas", tags:[], now:new Date().toISOString()}); setMsg("Content created.");}catch(e){setMsg(`Failed: ${(e as Error).message}`)}}}>Add Idea</button>
      {msg ? <small>{msg}</small> : null}
      {items.map((i)=><div className="card" key={i._id}>{i.title} · {i.status}</div>)}
    </div>
  );
}
