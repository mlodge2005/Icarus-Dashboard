"use client";

export default function EnvHealth() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const missing: string[] = [];
  if (!convexUrl) missing.push("NEXT_PUBLIC_CONVEX_URL");

  if (missing.length === 0) return null;

  return (
    <div style={{ background: "#fff3cd", borderBottom: "1px solid #f0d98c" }}>
      <div className="wrap" style={{ paddingTop: 8, paddingBottom: 8 }}>
        <strong>Environment setup required:</strong> missing {missing.join(", ")}. UI data features are offline.
      </div>
    </div>
  );
}
