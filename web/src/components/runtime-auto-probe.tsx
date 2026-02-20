"use client";

import { useEffect } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function RuntimeAutoProbe() {
  const probe = useAction((api as any).runtime.probe);
  const runDueSchedules = useMutation((api as any).protocols.runDueSchedules);
  const failSafeTick = useMutation((api as any).runtime.failSafeTick);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const now = new Date().toISOString();
      try { await probe({}); } catch {}
      try { await runDueSchedules({ now }); } catch {}
      try { await failSafeTick({ now }); } catch {}
    };

    void run();
    const id = setInterval(() => { if (mounted) void run(); }, 600000);

    return () => { mounted = false; clearInterval(id); };
  }, [probe, runDueSchedules, failSafeTick]);

  return null;
}
