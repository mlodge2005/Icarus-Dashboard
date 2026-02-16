import { auth } from "@/auth";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    return (
      <div className="card cardPad">
        <div className="h1">Task</div>
        <p style={{ color: "var(--muted)" }}>Please sign in.</p>
      </div>
    );
  }

  const { id } = await params;

  return (
    <>
      <div className="topbar">
        <div className="h1">Task</div>
      </div>
      <div className="card cardPad">
        <p style={{ color: "var(--muted)", margin: 0 }}>Task detail UI coming next. Task id: {id}</p>
      </div>
    </>
  );
}
