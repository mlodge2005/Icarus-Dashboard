"use client";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function OpsPage() {
  const snap = useQuery((api as any).ops.snapshot, {}) as any;
  if (!snap) return <div className="wrap">Loading...</div>;
  return (
    <div className="wrap">
      <h1>Ops Command Center</h1>
      <div className="grid">
        <section className="col"><h3>Now</h3>{snap.now.map((t: any) => <div className="card" key={t._id}>{t.title}</div>)}</section>
        <section className="col"><h3>Next</h3>{snap.next.map((t: any) => <div className="card" key={t._id}>{t.title}</div>)}</section>
        <section className="col"><h3>Blocked</h3>{snap.blocked.length ? snap.blocked.map((t: any) => <div className="card" key={t._id}>{t.title}</div>) : <small>No blocked tasks tagged yet</small>}</section>
      </div>
      <h3 style={{marginTop:16}}>Execution Timeline</h3>
      {snap.latestActivity.map((a: any) => (
        <div className="card" key={a._id}><small>{a.createdAt}</small> — {a.summary}</div>
      ))}
    </div>
  );
}
