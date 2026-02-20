import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowed = (process.env.GOOGLE_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!allowed.length) return true;
      const email = profile?.email?.toLowerCase();
      return !!email && allowed.includes(email);
    },
  },
  pages: {
    signIn: "/signin",
  },
});
