import Link from "next/link";
import "./globals.css";
import { ConvexClientProvider } from "@/components/provider";
import HeaderStatus from "@/components/header-status";
import EnvHealth from "@/components/env-health";
import HeaderTime from "@/components/header-time";
import { auth, signOut } from "@/auth";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const email = session?.user?.email ?? "unknown";

  return (
    <html lang="en">
      <body>
        <EnvHealth />
        <ConvexClientProvider>
          <header style={{ borderBottom: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" }}>
            <div className="wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <strong style={{ color: "var(--text)" }}>Icarus Hub</strong>
              <HeaderStatus />
              <HeaderTime />
              <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/ops">Ops</Link>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/protocols">Protocols</Link>
                <Link href="/capabilities">Capabilities</Link>
                <Link href="/projects">Projects</Link>
                <Link href="/content">Content</Link>
                <Link href="/documents">Documents</Link>
              </nav>
              <div className="card" style={{ margin: 0, padding: "6px 8px", display: "flex", alignItems: "center", gap: 8 }}>
                <small>{email}</small>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/signin" });
                  }}
                >
                  <button type="submit">Sign out</button>
                </form>
              </div>
            </div>
          </header>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
