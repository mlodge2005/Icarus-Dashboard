import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Icarus Dashboard</h1>
        <p>Login required.</p>
        <p>
          <a href="/api/auth/signin">Sign in with GitHub</a>
        </p>
      </main>
    );
  }

  const base = process.env.DASH_API_BASE_URL;
  const health = base
    ? await fetch(`${base}/health`, {
        headers: { "x-api-key": process.env.DASH_API_KEY || "" },
        cache: "no-store",
      }).then((r) => r.json())
    : { ok: false, error: "missing DASH_API_BASE_URL" };

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Icarus Dashboard</h1>
      <p>Signed in as: {session.user?.email || session.user?.name}</p>

      <h2>API Health</h2>
      <pre>{JSON.stringify(health, null, 2)}</pre>

      <p>
        <a href="/api/auth/signout">Sign out</a>
      </p>

      <p style={{ marginTop: 24 }}>
        <Link href="/">Home</Link>
      </p>
    </main>
  );
}
