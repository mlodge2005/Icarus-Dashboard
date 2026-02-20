import { signIn } from "@/auth";

export default function SignInPage({ searchParams }: { searchParams?: { callbackUrl?: string; error?: string } }) {
  const callbackUrl = searchParams?.callbackUrl || "/";
  const error = searchParams?.error;

  return (
    <div className="wrap">
      <div className="card" style={{ maxWidth: 420, margin: "32px auto" }}>
        <h2>Icarus Hub Sign-In</h2>
        <p><small>Sign in with your authorized Google account.</small></p>
        {error ? <p className="status-error"><small>Sign-in failed: {error}</small></p> : null}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl });
          }}
        >
          <button type="submit">Continue with Google</button>
        </form>
      </div>
    </div>
  );
}
