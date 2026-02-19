import Link from "next/link";
import "./globals.css";
import { ConvexClientProvider } from "@/components/provider";
import HeaderStatus from "@/components/header-status";
import EnvHealth from "@/components/env-health";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <EnvHealth />
        <ConvexClientProvider>
          <header style={{ borderBottom: "1px solid #e7e7e7", background: "#fff" }}>
            <div className="wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <strong>Wren OS</strong>
              <HeaderStatus />
              <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/ops">Ops</Link>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/protocols">Protocols</Link>
                <Link href="/capabilities">Capabilities</Link>
                <Link href="/projects">Projects</Link>
                <Link href="/content">Content</Link>
                <Link href="/documents">Documents</Link>
              </nav>
            </div>
          </header>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
