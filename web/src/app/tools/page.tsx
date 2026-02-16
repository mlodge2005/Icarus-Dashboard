import { auth } from "@/auth";

export default async function ToolsPage() {
  const session = await auth();
  if (!session) {
    return (
      <div className="card cardPad">
        <div className="h1">Tools</div>
        <p style={{ color: "var(--muted)" }}>Please sign in.</p>
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="h1">Tools</div>
      </div>
      <div className="card cardPad">
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Tools inventory + sync endpoint UI is next.
        </p>
      </div>
    </>
  );
}
