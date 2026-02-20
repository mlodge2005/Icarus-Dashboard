"use client";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function HeaderStatus() {
  const status = useQuery((api as any).system.status, {}) as { label: string; tone: string; detail: string; gateway?: string; processing?: boolean } | undefined;
  if (!status) return <small style={{ color: "#666" }}>Loading…</small>;

  const gwTone = status.gateway === "online" ? "#1E6BFF" : status.gateway === "offline" ? "#C13C3C" : "#F2A900";
  const procTone = status.processing ? "#1E6BFF" : "#666";

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: status.tone, display: "inline-block" }} />
        <small>{status.label}: {status.detail}</small>
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: gwTone, display: "inline-block" }} />
        <small>Gateway: {status.gateway ?? "unknown"}</small>
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: procTone, display: "inline-block" }} />
        <small>{status.processing ? "Processing" : "Idle"}</small>
      </span>
    </span>
  );
}
