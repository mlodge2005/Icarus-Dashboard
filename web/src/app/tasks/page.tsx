import { auth } from "@/auth";

export default async function TasksPage() {
  const session = await auth();
  if (!session) {
    return (
      <div className="card cardPad">
        <div className="h1">Tasks</div>
        <p style={{ color: "var(--muted)" }}>Please sign in.</p>
      </div>
    );
  }

  return (
    <>
      <div className="topbar">
        <div className="h1">Tasks</div>
      </div>
      <div className="card cardPad">
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Task board UI is next. This page is online and wired into the dashboard shell.
        </p>
      </div>
    </>
  );
}
