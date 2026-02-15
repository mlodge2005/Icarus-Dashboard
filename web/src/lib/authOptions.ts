import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Only allow NextAuth conventional env vars.
const googleId = process.env.GOOGLE_ID;
const googleSecret = process.env.GOOGLE_SECRET;

// Restrict access to a single Google account email.
const allowedEmail = (process.env.AUTH_GOOGLE_ALLOWED_EMAIL || "mlodge2005@gmail.com").toLowerCase();

export function getAuthOptions(): NextAuthOptions {
  if (!googleId || !googleSecret) {
    throw new Error(
      "Missing Google OAuth env vars. Set GOOGLE_ID + GOOGLE_SECRET in Vercel env vars."
    );
  }

  return {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
      GoogleProvider({
        clientId: googleId,
        clientSecret: googleSecret,
      }),
    ],
    callbacks: {
      async signIn({ profile }) {
        const email = (profile as any)?.email;
        if (!email) return false;
        return String(email).toLowerCase() === allowedEmail;
      },
    },
  };
}
