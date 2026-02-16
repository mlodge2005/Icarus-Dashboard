"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";

type Bot = {
  id: string;
  name: string;
  status: string;
  lastHeartbeatAt: string | null;
  currentTaskId: string | null;
  version: string | null;
} | null;

type Overview = {
  bot: Bot;
  counts: { todo: number; in_progress: number; done: number };
};

type AgentState = {
  mode: string;
  detail: string | null;
  subagentsRunning: number;
  updatedAt: string | null;
};

function statusFromHeartbeat(last: Date | null) {
  if (!last) return { label: "Offline", color: "var(--bad)" };
  const ageSec = (Date.now() - last.getTime()) / 1000;
  if (ageSec <= 30) return { label: "Online", color: "var(--good)" };
  if (ageSec <= 120) return { label: "Degraded", color: "var(--warn)" };
  return { label: "Offline", color: "var(--bad)" };
}

export function OverviewPanel({ initial }: { initial: Overview }) {
  const [data, setData] = useState<Overview>(initial);
  const [agentState, setAgentState] = useState<AgentState>({
    mode: initial.bot?.status || "idle",
    detail: initial.bot?.currentTaskId || null,
    subagentsRunning: 0,
    updatedAt: initial.bot?.lastHeartbeatAt || null,
  });

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const [overviewRes, stateRes] = await Promise.all([
          fetch("/api/overview", { cache: "no-store" }),
          fetch("/api/agent-state", { cache: "no-store" }),
        ]);

        if (overviewRes.ok) {
          const json = (await overviewRes.json()) as Overview;
          if (!stop) setData(json);
        }

        if (stateRes.ok) {
          const state = (await stateRes.json()) as AgentState;
          if (!stop) setAgentState(state);
        }
      } catch {
        // ignore transient poll errors
      }
    };
    const id = window.setInterval(() => void tick(), 10000);
    void tick();
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, []);

  const last = data.bot?.lastHeartbeatAt ? new Date(data.bot.lastHeartbeatAt) : null;
  const s = statusFromHeartbeat(last);

  return (
    <>
      <div className="grid grid2">
        <div className="card cardPad">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <div>
              <div style={{ fontWeight: 650 }}>{data.bot?.name || "Icarus"}</div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                Last heartbeat: {last ? formatDistanceToNowStrict(last, { addSuffix: true }) : "never"}
              </div>
            </div>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>v{data.bot?.version || "—"}</div>
          </div>

          <div style={{ marginTop: 14, color: "var(--muted)", fontSize: 12 }}>Current task</div>
          <div style={{ marginTop: 6, fontWeight: 650 }}>{data.bot?.currentTaskId || "—"}</div>
        </div>

        <div className="card cardPad">
          <div style={{ fontWeight: 650, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
            <span>Quick counts</span>
            <span className="badge">
              <span className="dot" style={{ background: s.color }} />
              {s.label}
            </span>
          </div>
          <div className="kpis">
            <div className="kpi">
              <div className="kpiLabel">Todo</div>
              <div className="kpiValue">{data.counts.todo}</div>
            </div>
            <div className="kpi">
              <div className="kpiLabel">In Progress</div>
              <div className="kpiValue">{data.counts.in_progress}</div>
            </div>
            <div className="kpi">
              <div className="kpiLabel">Done</div>
              <div className="kpiValue">{data.counts.done}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="card cardPad">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontWeight: 650 }}>Live agent state</div>
          <span className="badge">
            <span className="dot" style={{ background: agentState.mode === "blocked" || agentState.mode === "error" ? "var(--bad)" : agentState.mode === "working" || agentState.mode === "subagent" ? "var(--warn)" : "var(--good)" }} />
            {agentState.mode || "idle"}
          </span>
        </div>
        <div style={{ fontSize: 13 }}>{agentState.detail || "—"}</div>
        <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>
          Sub-agents running: {agentState.subagentsRunning ?? 0}
          {agentState.updatedAt ? ` · Updated ${formatDistanceToNowStrict(new Date(agentState.updatedAt), { addSuffix: true })}` : ""}
        </div>
      </div>

      <div style={{ height: 14 }} />
      <div className="card cardPad" style={{ color: "var(--muted)", fontSize: 13 }}>
        Status updates poll automatically (no refresh required).
      </div>
    </>
  );
}
