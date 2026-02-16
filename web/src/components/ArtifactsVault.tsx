"use client";

import { useState } from "react";

type Artifact = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  taskId: string | null;
  createdAt: string;
};

function humanSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function ArtifactsVault({ artifacts }: { artifacts: Artifact[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function download(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/artifacts/${id}/download`);
      if (!res.ok) throw new Error("download failed");
      const data = (await res.json()) as { url: string };
      window.open(data.url, "_blank", "noopener,noreferrer");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <>
      <div className="topbar">
        <div className="h1">Artifacts</div>
      </div>

      {artifacts.length === 0 ? (
        <div className="card cardPad" style={{ color: "var(--muted)" }}>
          No artifacts yet.
        </div>
      ) : (
        <div className="card cardPad">
          <div className="grid" style={{ gap: 8 }}>
            {artifacts.map((a) => (
              <div
                key={a.id}
                style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10, display: "flex", justifyContent: "space-between", gap: 12 }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{a.filename}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                    {a.mimeType} · {humanSize(a.sizeBytes)} · {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>
                <button className="btn" onClick={() => void download(a.id)} disabled={loadingId === a.id}>
                  {loadingId === a.id ? "Opening..." : "Download"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
