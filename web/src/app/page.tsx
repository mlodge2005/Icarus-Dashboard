import Link from "next/link";

export default function Home() {
  return (
    <div className="wrap">
      <h1>Wren OS</h1>
      <p>Operator control surface.</p>
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
