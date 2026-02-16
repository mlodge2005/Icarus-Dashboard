import { auth } from "@/auth";

export default async function ArtifactsPage() {
  const session = await auth();
  if (!session) {
    return (
      <div className="card cardPad">
        <div className="h1">Artifacts</div>
        <p style={{ color: "var(--muted)" }}>Please sign in.</p>
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="h1">Artifacts</div>
      </div>
      <div className="card cardPad">
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Artifact vault + presigned upload/download endpoints are next.
        </p>
      </div>
    </>
  );
}
