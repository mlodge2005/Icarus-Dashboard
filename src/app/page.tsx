import Link from "next/link";

export default function Home() {
  return <div className="wrap"><h1>Wren OS</h1><p><Link href="/dashboard">Open Dashboard</Link></p></div>;
}
