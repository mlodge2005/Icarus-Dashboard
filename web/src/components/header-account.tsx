"use client";

import { useMemo, useState } from "react";
import { signOut } from "next-auth/react";

type Props = {
  email?: string | null;
  image?: string | null;
  name?: string | null;
};

export default function HeaderAccount({ email, image, name }: Props) {
  const [open, setOpen] = useState(false);

  const initials = useMemo(() => {
    const src = name || email || "U";
    return src.slice(0, 2).toUpperCase();
  }, [name, email]);

  return (
    <>
      <button
        aria-label="Open account settings"
        onClick={() => setOpen(true)}
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          overflow: "hidden",
          padding: 0,
          display: "grid",
          placeItems: "center",
          border: "1px solid var(--border)",
          background: "#0E141B",
          cursor: "pointer",
        }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <small>{initials}</small>
        )}
      </button>

      {open ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "grid", placeItems: "center", zIndex: 60 }}>
          <div className="col" style={{ width: 360 }}>
            <div className="head">
              <h3 style={{ margin: 0 }}>Account Settings</h3>
              <button className="btn-secondary" onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="card" style={{ margin: 0 }}>
              <div><small>Signed in as</small></div>
              <div>{name || "Google User"}</div>
              <div><small>{email || "No email"}</small></div>
            </div>
            <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => signOut({ callbackUrl: "/signin" })}>Sign out</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
