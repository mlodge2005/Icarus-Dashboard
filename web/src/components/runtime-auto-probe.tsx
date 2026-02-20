"use client";

import { useEffect } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function RuntimeAutoProbe() {
  const probe = useAction((api as any).runtime.probe);
  const runDueSchedules = useMutation((api as any).protocols.runDueSchedules);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        await probe({});
      } catch {
        // non-blocking: header can still show last known state
      }
      try {
        await runDueSchedules({ now: new Date().toISOString() });
      } catch {
        // non-blocking
      }
    };

    void run();
    const id = setInterval(() => {
      if (mounted) void run();
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [probe, runDueSchedules]);

  return null;
}
