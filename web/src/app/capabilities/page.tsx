"use client";
import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function CapabilitiesPage() {
  const items = (useQuery(api.capabilities.list, {}) as any[] | undefined) ?? [];
  const probe = useMutation(api.capabilities.autoProbe);
  useEffect(() => { void probe({ now: new Date().toISOString() }); }, [probe]);

  return (
    <div className="wrap">
      <div className="head"><h1>Capabilities Registry</h1><button onClick={() => void probe({ now: new Date().toISOString() })}>Refresh</button></div>
      <p><small>Auto-updated status of Icarus runtime capabilities.</small></p>
      {items.length === 0 ? <div className="card">No capability records yet. Click Refresh.</div> : null}
      {items.map((c) => (
        <div className="card" key={c._id}><strong>{c.name}</strong> — <small>{c.status}</small><div><small>Requirement:</small> {c.requirement}</div><div><small>Last result:</small> {c.lastResult ?? "n/a"}</div><div><small>Fix:</small> {c.fixHint ?? "n/a"}</div><div><small>Checked:</small> {c.lastCheckedAt ?? "n/a"}</div></div>
      ))}
    </div>
  );
}
