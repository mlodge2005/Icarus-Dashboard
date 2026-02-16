import { auth } from "@/auth";
import { ToolsList } from "@/components/ToolsList";
import { prisma } from "@/lib/prisma";

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

  const tools = await prisma.tool.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });

  return <ToolsList tools={tools} />;
}
