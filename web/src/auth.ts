import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowedEmail = (process.env.AUTH_GOOGLE_ALLOWED_EMAIL || "mlodge2005@gmail.com").toLowerCase();

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ profile }) {
      const email = (profile as any)?.email;
      if (!email) return false;
      return String(email).toLowerCase() === allowedEmail;
    },
  },
});
