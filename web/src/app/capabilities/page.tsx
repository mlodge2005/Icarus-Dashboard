"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function CapabilitiesPage() {
  const items = (useQuery((api as any).capabilities.list, {}) as any[] | undefined) ?? [];
  const probe = useMutation((api as any).capabilities.autoProbe);

  return (
    <div className="wrap">
      <div className="head"><h1>Capabilities Registry</h1><button onClick={() => void probe({ now: new Date().toISOString() })}>Run Auto Probe</button></div>
      <p><small>Runs environment checks (AGENT_KEY / CONVEX_DEPLOYMENT / push readiness) and updates statuses.</small></p>
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
