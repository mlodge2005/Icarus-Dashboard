"use client";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function PromptLogPage() {
  const logs = (useQuery((api as any).promptLogs.list, {}) as any[] | undefined) ?? [];
  const append = useMutation((api as any).promptLogs.append);
  const [promptSummary, setPromptSummary] = useState("");
  const [actionSummary, setActionSummary] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <div className="wrap">
      <h1>Prompt Log</h1>
      <p><small>One-line prompt summary + one-line action/response summary with timestamp.</small></p>

      <div className="card">
        <label><small>Prompt summary (one line)</small></label>
        <input value={promptSummary} onChange={(e)=>setPromptSummary(e.target.value)} maxLength={280} />
        <label><small>Action/response summary (one line)</small></label>
        <input value={actionSummary} onChange={(e)=>setActionSummary(e.target.value)} maxLength={280} />
        <div style={{marginTop:8}}>
          <button onClick={async()=>{
            try {
              if (!promptSummary.trim() || !actionSummary.trim()) throw new Error("Both lines are required.");
              await append({ promptSummary: promptSummary.trim(), actionSummary: actionSummary.trim(), source: "manual", now: new Date().toISOString() });
              setPromptSummary("");
              setActionSummary("");
              setMsg("Prompt log appended.");
            } catch (e) { setMsg((e as Error).message); }
          }}>Append Log Line</button>
        </div>
        {msg ? <small>{msg}</small> : null}
      </div>

      {logs.map((l)=>(
        <div className="card" key={l._id}>
          <div><small>{l.createdAt}</small>{l.source ? <small> · {l.source}</small> : null}</div>
          <div><strong>Prompt:</strong> {l.promptSummary}</div>
          <div><strong>Action:</strong> {l.actionSummary}</div>
        </div>
      ))}
    </div>
  );
}
