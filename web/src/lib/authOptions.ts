import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

const allowedLogin = (process.env.AUTH_GITHUB_ALLOWED_LOGIN || "mlodge2005").toLowerCase();

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
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
