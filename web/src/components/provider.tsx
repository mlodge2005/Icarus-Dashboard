"use client";
import { ConvexReactClient, ConvexProvider } from "convex/react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  if (!url) {
    return <div style={{padding:12,background:"#fff3cd",borderBottom:"1px solid #f0d98c"}}>Missing NEXT_PUBLIC_CONVEX_URL. UI is offline until configured.</div>;
  }
  const client = new ConvexReactClient(url);
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
