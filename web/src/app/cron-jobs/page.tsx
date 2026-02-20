"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type CronJob = {
  id: string;
  name?: string;
  description?: string;
  enabled?: boolean;
  schedule?: { kind?: string; expr?: string; tz?: string };
  state?: { nextRunAtMs?: number; lastRunAtMs?: number; lastStatus?: string };
  payload?: { kind?: string };
  sessionTarget?: string;
  displayTitle?: string;
  outcomeSummary?: string;
  toolsUsed?: string[];
};

export default function CronJobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/cron-jobs", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setJobs((data.jobs ?? []) as CronJob[]);
      setLastRefresh(new Date().toISOString());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(
    () => [...jobs].sort((a, b) => String(a.name ?? a.id).localeCompare(String(b.name ?? b.id))),
    [jobs],
  );

  return (
    <div className="wrap">
      <div className="head">
        <h1>Cron Jobs</h1>
        <button onClick={() => void load()} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</button>
      </div>
      <p><small>Live view from <code>openclaw cron list --json</code>.</small></p>
      {lastRefresh ? <p><small>Last refresh: {lastRefresh}</small></p> : null}
      {error ? <div className="card">Error: {error}</div> : null}
      {!loading && sorted.length === 0 ? <div className="card">No cron jobs found.</div> : null}
      {sorted.map((job) => (
        <div className="card" key={job.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <strong>{job.displayTitle ?? job.name ?? "(unnamed job)"}</strong>
            <small>{job.enabled ? "enabled" : "disabled"}</small>
          </div>
          <div><small>ID:</small> {job.id}</div>
          <div><small>Description:</small> {job.description ?? "—"}</div>
          <div><small>Schedule:</small> {job.schedule?.kind ?? "—"} {job.schedule?.expr ?? ""} {job.schedule?.tz ? `(${job.schedule.tz})` : ""}</div>
          <div><small>Session:</small> {job.sessionTarget ?? "—"}</div>
          <div><small>Payload:</small> {job.payload?.kind ?? "—"}</div>
          <div><small>Outcome:</small> {job.outcomeSummary ?? "No runs yet."}</div>
          <div><small>Tools:</small> {(job.toolsUsed && job.toolsUsed.length > 0) ? job.toolsUsed.join(", ") : "—"}</div>
          <div><small>Next run:</small> {job.state?.nextRunAtMs ? new Date(job.state.nextRunAtMs).toISOString() : "—"}</div>
          <div><small>Last run:</small> {job.state?.lastRunAtMs ? new Date(job.state.lastRunAtMs).toISOString() : "—"}</div>
          <div><small>Last status:</small> {job.state?.lastStatus ?? "—"}</div>
        </div>
      ))}
    </div>
  );
}
