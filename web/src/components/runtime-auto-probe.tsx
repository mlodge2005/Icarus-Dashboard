"use client";

import { useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function RuntimeAutoProbe() {
  const probe = useAction((api as any).runtime.probe);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        await probe({});
      } catch {
        // non-blocking: header can still show last known state
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
  }, [probe]);

  return null;
}
