"use client";

import { useMemo, useState } from "react";

type Tool = {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  notes: string | null;
};

export function ToolsList({ tools }: { tools: Tool[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return tools;
    return tools.filter((t) => `${t.name} ${t.category} ${t.notes ?? ""}`.toLowerCase().includes(needle));
  }, [q, tools]);

  const grouped = useMemo(() => {
    const m = new Map<string, Tool[]>();
    for (const t of filtered) {
      const arr = m.get(t.category) ?? [];
      arr.push(t);
      m.set(t.category, arr);
    }
    return [...m.entries()];
  }, [filtered]);

  return (
    <>
      <div className="topbar">
        <div className="h1">Tools</div>
      </div>
      <div className="card cardPad" style={{ marginBottom: 12 }}>
        <input className="input" placeholder="Search tools" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {grouped.length === 0 ? (
        <div className="card cardPad" style={{ color: "var(--muted)" }}>
          No tools found.
        </div>
      ) : (
        grouped.map(([category, items]) => (
          <div key={category} className="card cardPad" style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 650, marginBottom: 8 }}>{category}</div>
            <div className="grid" style={{ gap: 8 }}>
              {items.map((t) => (
                <div key={t.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10, display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.name}</div>
                    {t.notes ? <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{t.notes}</div> : null}
                  </div>
                  <div className="badge">
                    <span className="dot" style={{ background: t.enabled ? "var(--good)" : "var(--bad)" }} />
                    {t.enabled ? "Enabled" : "Disabled"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}
