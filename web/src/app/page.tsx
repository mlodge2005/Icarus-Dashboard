import { auth, signIn, signOut } from "@/auth";

export default async function Home() {
  const missingOauth = !process.env.GOOGLE_ID || !process.env.GOOGLE_SECRET || !process.env.NEXTAUTH_SECRET;
  if (missingOauth) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Icarus Dashboard</h1>
        <p>
          Server is missing auth env vars. Set GOOGLE_ID + GOOGLE_SECRET + NEXTAUTH_SECRET in Vercel (Production), then redeploy.
        </p>
      </main>
    );
  }

  const session = await auth();

  if (!session) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Icarus Dashboard</h1>
        <p>Login required.</p>
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button type="submit">Sign in with Google</button>
        </form>
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

      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}
