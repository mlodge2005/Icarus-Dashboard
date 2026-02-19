"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function CapabilitiesPage() {
  const items = (useQuery((api as any).capabilities.list, {}) as any[] | undefined) ?? [];
  const upsert = useMutation((api as any).capabilities.upsert);

  const seed = async () => {
    const now = new Date().toISOString();
    await upsert({ name: "GitHub Push", status: "available", requirement: "SSH key configured", lastResult: "push ok", fixHint: "", now });
    await upsert({ name: "Convex Deploy", status: "blocked", requirement: "CONVEX_DEPLOYMENT", lastResult: "missing env", fixHint: "set CONVEX_DEPLOYMENT", now });
    await upsert({ name: "Discord Read", status: "blocked", requirement: "message tool access", lastResult: "tool unavailable", fixHint: "enable channel tool", now });
  };

  return (
    <div className="wrap">
      <div className="head"><h1>Capabilities Registry</h1><button onClick={() => void seed()}>Seed / Refresh checks</button></div>
      <p><small>Purpose: show what the agent can do right now in this environment. “Seed / Refresh checks” writes baseline capability states.</small></p>
      {items.map((c) => (
        <div className="card" key={c._id}>
          <strong>{c.name}</strong> — <small>{c.status}</small>
          <div><small>Requirement:</small> {c.requirement}</div>
          <div><small>Last result:</small> {c.lastResult ?? "n/a"}</div>
          <div><small>Fix:</small> {c.fixHint ?? "n/a"}</div>
          <div><small>Checked:</small> {c.lastCheckedAt ?? "n/a"}</div>
        </div>
      ))}
    </div>
  );
}
