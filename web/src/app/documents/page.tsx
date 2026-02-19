"use client";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function Documents() {
  const docs = (useQuery((api as any).documents.list, {}) as any[] | undefined) ?? [];
  return <div className="wrap"><h1>Documents</h1>{docs.map((d)=><div className="card" key={d._id}>{d.title}</div>)}</div>;
}
