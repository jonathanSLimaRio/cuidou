import type { UserRole, UserStatus } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

if (!authSecret && process.env.NODE_ENV === "production") {
  throw new Error(
    "AUTH_SECRET environment variable is required in production. " +
      "Generate one with: openssl rand -base64 32",
  );
}

const isProd = process.env.NODE_ENV === "production";

const authConfig = {
  trustHost: true,
  secret: authSecret,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: isProd ? "__Secure-cuidou.session-token" : "cuidou.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: isProd,
      },
    },
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user.role ?? null) as UserRole | null;
        token.status = (user.status ?? "ACTIVE") as UserStatus;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub ?? session.user.id) as string;
        session.user.role = (token.role ?? null) as UserRole | null;
        session.user.status = (token.status ?? "ACTIVE") as UserStatus;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
