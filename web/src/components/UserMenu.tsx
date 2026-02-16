"use client";

import { signOut } from "next-auth/react";

export function UserMenu({ email }: { email?: string | null }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div className="badge" title={email || ""}>
        <span className="dot" style={{ background: "rgba(255,255,255,0.25)" }} />
        <span style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {email || "Signed in"}
        </span>
      </div>
      <button
        className="btn"
        onClick={() => signOut({ callbackUrl: "/dashboard" })}
        aria-label="Log out"
        title="Log out"
      >
        Log out
      </button>
    </div>
  );
}
