"use client";
import { ConvexReactClient, ConvexProvider } from "convex/react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? "http://127.0.0.1:3210";
const client = new ConvexReactClient(url);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
