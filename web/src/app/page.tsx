import Link from "next/link";

export default function Home() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  return (
    <div className="wrap">
      <h1>Wren OS</h1>
      <p>Operator control surface.</p>

      <div className="card" style={{ marginBottom: 12 }}>
        <strong>Startup Health</strong>
        <div>NEXT_PUBLIC_CONVEX_URL: {convexUrl ? "configured" : "missing"}</div>
        <div>AGENT_KEY: server-side only (validate in Convex/Vercel env)</div>
      </div>

      <ul>
        <li><Link href="/ops">Ops Command Center</Link></li>
        <li><Link href="/dashboard">Dashboard</Link></li>
        <li><Link href="/protocols">Protocols</Link></li>
        <li><Link href="/capabilities">Capabilities</Link></li>
        <li><Link href="/projects">Projects</Link></li>
        <li><Link href="/content">Content</Link></li>
        <li><Link href="/documents">Documents</Link></li>
      </ul>
    </div>
  );
}
