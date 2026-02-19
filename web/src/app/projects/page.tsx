"use client";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function Projects() {
  const items = (useQuery(api.projects.list, {}) as any[] | undefined) ?? [];
  const create = useMutation(api.projects.create);
  const [name, setName] = useState("New Project");
  const [msg, setMsg] = useState("");
  return (
    <div className="wrap">
      <h1>Projects</h1>
      <p><small>Create a project to group related tasks.</small></p>
      <input value={name} onChange={(e)=>setName(e.target.value)} />
      <button onClick={async ()=>{try{await create({name, now:new Date().toISOString()}); setMsg("Project created.");}catch(e){setMsg(`Failed: ${(e as Error).message}`)}}}>Create Project</button>
      {msg ? <small>{msg}</small> : null}
      {items.map((p) => <div className="card" key={p._id}>{p.name}</div>)}
    </div>
  );
}
