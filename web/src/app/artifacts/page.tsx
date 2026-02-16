import { auth } from "@/auth";
import { ArtifactsVault } from "@/components/ArtifactsVault";
import { prisma } from "@/lib/prisma";

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

  const artifacts = await prisma.artifact.findMany({ orderBy: { createdAt: "desc" } });

  return <ArtifactsVault artifacts={artifacts.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))} />;
}
