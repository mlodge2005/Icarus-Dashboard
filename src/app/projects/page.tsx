"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function Projects() {
  const items = useQuery(api.projects.list, {}) ?? [];
  const create = useMutation(api.projects.create);
  return (
    <div className="wrap">
      <h1>Projects</h1>
      <button onClick={() => void create({ name: `Project ${items.length + 1}`, now: new Date().toISOString() })}>New</button>
      {items.map((p) => <div className="card" key={p._id}>{p.name}</div>)}
    </div>
  );
}
