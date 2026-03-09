import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, profile }) {
      if (!token.email) {
        return token;
      }

      const user = await prisma.user.upsert({
        where: { email: token.email },
        update: {
          name:
            typeof token.name === "string" && token.name.trim().length > 0
              ? token.name
              : undefined,
        },
        create: {
          email: token.email,
          name:
            typeof token.name === "string" && token.name.trim().length > 0
              ? token.name
              : null,
        },
      });

      token.userId = user.id;

      if (
        !token.name &&
        profile &&
        "name" in profile &&
        typeof profile.name === "string"
      ) {
        token.name = profile.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
      }

      return session;
    },
  },
});
