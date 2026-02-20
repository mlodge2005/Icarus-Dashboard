import Link from "next/link";
import "./globals.css";
import { ConvexClientProvider } from "@/components/provider";
import HeaderStatus from "@/components/header-status";
import EnvHealth from "@/components/env-health";
import HeaderTime from "@/components/header-time";
import HeaderAccount from "@/components/header-account";
import RuntimeAutoProbe from "@/components/runtime-auto-probe";
import AppSessionProvider from "@/components/session-provider";
import { auth } from "@/auth";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <AppSessionProvider session={session}>
          <EnvHealth />
          <ConvexClientProvider>
            <RuntimeAutoProbe />
            <header style={{ borderBottom: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" }}>
              <div className="wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 12, justifyContent: "flex-start" }}>
                  <strong style={{ color: "var(--text)" }}>Icarus Hub</strong>
                  <HeaderStatus />
                </div>
                <HeaderTime />
                <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Link href="/ops">Ops</Link>
                  <Link href="/dashboard">Dashboard</Link>
                  <Link href="/protocols">Protocols</Link>
                  <Link href="/capabilities">Capabilities</Link>
                  <Link href="/cron-jobs">Cron Jobs</Link>
                  <Link href="/projects">Projects</Link>
                  <Link href="/content">Prompt Log</Link>
                  <Link href="/documents">Documents</Link>
                </nav>
                <HeaderAccount
                  email={session?.user?.email}
                  image={session?.user?.image}
                  name={session?.user?.name}
                />
              </div>
            </header>
            {children}
          </ConvexClientProvider>
        </AppSessionProvider>
      </body>
    </html>
  );
}
