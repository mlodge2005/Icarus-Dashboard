import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

// Support both our custom env names and NextAuth conventional names.
const githubId = process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID;
const githubSecret = process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET;
const allowedLogin = (process.env.AUTH_GITHUB_ALLOWED_LOGIN || "mlodge2005").toLowerCase();

export function getAuthOptions(): NextAuthOptions {
  if (!githubId || !githubSecret) {
    throw new Error(
      "Missing GitHub OAuth env vars. Set AUTH_GITHUB_ID + AUTH_GITHUB_SECRET (or GITHUB_ID + GITHUB_SECRET) in Vercel env vars."
    );
  }

  return {
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    providers: [
      GitHubProvider({
        clientId: githubId,
        clientSecret: githubSecret,
      }),
    ],
    callbacks: {
      async signIn({ profile }) {
        const login = (profile as any)?.login;
        if (!login) return false;
        return String(login).toLowerCase() === allowedLogin;
      },
    },
  };
}
