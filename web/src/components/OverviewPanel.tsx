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
  counts: { todo: number; in_progress: number; blocked: number; done: number };
};

type AgentEvent = {
  id: string;
  mode: string;
  detail: string | null;
  subagentsRunning: number;
  createdAt: string;
};

type AgentState = {
  mode: string;
  detail: string | null;
  subagentsRunning: number;
  updatedAt: string | null;
  events?: AgentEvent[];
};

type TaskLite = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "blocked" | "done";
  notes: string | null;
  updatedAt: string;
};

function compact(input: string, max = 120) {
  const oneLine = input.replace(/\s+/g, " ").trim();
  if (!oneLine) return "—";
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
}

function parseMeta(payload: string) {
  const out: Record<string, string> = {};
  for (const part of payload.split(";")) {
    const i = part.indexOf("=");
    if (i <= 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

type ParsedDetail = {
  title: string;
  meta: string[];
};

function parseEventDetail(detail: string | null): ParsedDetail {
  if (!detail) return { title: "—", meta: [] };

  const idx = detail.indexOf(":");
  if (idx <= 0) return { title: compact(detail, 140), meta: [] };

  const event = detail.slice(0, idx).trim();
  const payload = detail.slice(idx + 1).trim();
  const meta = parseMeta(payload);

  const title = meta.action
    ? compact(meta.action, 90)
    : event === "message_sending"
      ? "Replying to user"
      : event === "message_sent"
        ? "Reply sent"
        : event === "agent_end"
          ? "Turn complete"
          : event === "session_start"
            ? "Session started"
            : event === "session_end"
              ? "Session ended"
              : event === "gateway_start"
                ? "Gateway online"
                : event === "gateway_stop"
                  ? "Gateway stopping"
                  : compact(`${event}: ${payload}`, 140);

  const lines: string[] = [];
  if (meta.tool) lines.push(`Tool: ${compact(meta.tool, 40)}`);
  if (meta.cmd) lines.push(`Command: ${compact(meta.cmd, 160)}`);
  else if (meta.params && (event === "before_tool_call" || event === "after_tool_call")) lines.push(`Params: ${compact(meta.params, 160)}`);

  const statusBits: string[] = [];
  if (meta.status) statusBits.push(meta.status);
  if (meta.durationMs) statusBits.push(`${meta.durationMs}ms`);
  if (statusBits.length) lines.push(`Meta: ${statusBits.join(" · ")}`);
  if (meta.error) lines.push(`Error: ${compact(meta.error, 160)}`);

  return { title, meta: lines };
}

function getQueueMonitor(notes: string | null) {
  const src = String(notes || "");
  const m = src.match(/^\[queue-monitor\]\s+polling=(\w+)\s+lastPollAt=([^\n]+)/m);
  if (!m) return null;
  return { polling: m[1], lastPollAt: m[2] };
}

function latestCommandEvent(events: AgentEvent[] | undefined) {
  if (!events?.length) return null;
  for (const ev of events) {
    const idx = (ev.detail || "").indexOf(":");
    if (idx <= 0) continue;
    const eventName = (ev.detail || "").slice(0, idx).trim();
    const payload = (ev.detail || "").slice(idx + 1).trim();
    const meta = parseMeta(payload);
    if (eventName === "after_tool_call" && (meta.tool === "exec" || meta.tool === "process")) {
      return {
        when: ev.createdAt,
        status: meta.status || "unknown",
        cmd: meta.cmd || meta.params || "—",
        durationMs: meta.durationMs || null,
        error: meta.error || null,
      };
    }
  }
  return null;
}

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
  const [activeTask, setActiveTask] = useState<TaskLite | null>(null);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const [overviewRes, stateRes, tasksRes] = await Promise.all([
          fetch("/api/overview", { cache: "no-store" }),
          fetch("/api/agent-state", { cache: "no-store" }),
          fetch("/api/tasks?status=in_progress", { cache: "no-store" }),
        ]);

        if (overviewRes.ok) {
          const json = (await overviewRes.json()) as Overview;
          if (!stop) setData(json);
        }

        if (stateRes.ok) {
          const state = (await stateRes.json()) as AgentState;
          if (!stop) setAgentState(state);
        }

        if (tasksRes.ok) {
          const json = (await tasksRes.json()) as { tasks?: TaskLite[] };
          if (!stop) setActiveTask((json.tasks || [])[0] ?? null);
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
              <div className="kpiLabel">Blocked</div>
              <div className="kpiValue">{data.counts.blocked}</div>
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
        {(() => {
          const d = parseEventDetail(agentState.detail);
          return (
            <div>
              <div style={{ fontSize: 13 }}>{d.title}</div>
              {d.meta.map((line, i) => (
                <div key={i} style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{line}</div>
              ))}
            </div>
          );
        })()}
        <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>
          Sub-agents running: {agentState.subagentsRunning ?? 0}
          {agentState.updatedAt ? ` · Updated ${formatDistanceToNowStrict(new Date(agentState.updatedAt), { addSuffix: true })}` : ""}
        </div>
      </div>

      <div style={{ height: 14 }} />
      <div className="card cardPad">
        <div style={{ fontWeight: 650, marginBottom: 8 }}>Queue monitor</div>
        {(() => {
          const monitor = getQueueMonitor(activeTask?.notes || null);
          const lastCmd = latestCommandEvent(agentState.events);
          return (
            <div className="grid" style={{ gap: 8 }}>
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Polling</div>
                <div style={{ marginTop: 4, fontSize: 13 }}>
                  {monitor ? `on · last ${formatDistanceToNowStrict(new Date(monitor.lastPollAt), { addSuffix: true })}` : "unknown"}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted)" }}>
                  interval: 60s when no active handoff needed
                </div>
              </div>

              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Active queue task</div>
                <div style={{ marginTop: 4, fontSize: 13 }}>{activeTask?.title || "none"}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted)" }}>
                  status: {activeTask?.status || "—"}
                </div>
              </div>

              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Last command completion</div>
                {lastCmd ? (
                  <>
                    <div style={{ marginTop: 4, fontSize: 13 }}>
                      {lastCmd.status}{lastCmd.durationMs ? ` · ${lastCmd.durationMs}ms` : ""} · {formatDistanceToNowStrict(new Date(lastCmd.when), { addSuffix: true })}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted)" }}>cmd: {compact(lastCmd.cmd, 160)}</div>
                    {lastCmd.error ? <div style={{ marginTop: 4, fontSize: 12, color: "var(--bad)" }}>error: {compact(lastCmd.error, 140)}</div> : null}
                  </>
                ) : (
                  <div style={{ marginTop: 4, fontSize: 13, color: "var(--muted)" }}>No command completion event yet.</div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      <div style={{ height: 14 }} />
      <div className="card cardPad" style={{ color: "var(--muted)", fontSize: 13 }}>
        Status updates poll automatically (no refresh required).
      </div>
    </>
  );
}
