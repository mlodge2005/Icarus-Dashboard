"use client";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function HeaderStatus() {
  const status = useQuery((api as any).system.status, {}) as { label: string; tone: string; detail: string } | undefined;
  if (!status) return <small style={{ color: "#666" }}>Loading…</small>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: 99, background: status.tone, display: "inline-block" }} />
      <small>{status.label}: {status.detail}</small>
    </span>
  );
}
