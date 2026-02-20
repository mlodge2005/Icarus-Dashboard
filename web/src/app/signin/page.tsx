import { signIn } from "@/auth";

export default function SignInPage() {
  return (
    <div className="wrap">
      <div className="card" style={{ maxWidth: 420, margin: "32px auto" }}>
        <h2>Icarus Hub Sign-In</h2>
        <p><small>Sign in with Google to access the dashboard.</small></p>
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button type="submit">Continue with Google</button>
        </form>
      </div>
    </div>
  );
}
