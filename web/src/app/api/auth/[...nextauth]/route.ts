import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/authOptions";

function configError(message: string) {
  return new Response(message, {
    status: 500,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export async function GET(req: Request) {
  try {
    const handler = NextAuth(getAuthOptions());
    // @ts-ignore
    return handler(req);
  } catch (e: any) {
    return configError(String(e?.message || e));
  }
}

export async function POST(req: Request) {
  try {
    const handler = NextAuth(getAuthOptions());
    // @ts-ignore
    return handler(req);
  } catch (e: any) {
    return configError(String(e?.message || e));
  }
}
