"use client";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function Content() {
  const items = useQuery(api.content.list, {}) ?? [];
  return <div className="wrap"><h1>Content Queue</h1>{items.map((i)=><div className="card" key={i._id}>{i.title} · {i.status}</div>)}</div>;
}
