import authConfig from "@/auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { UserStatus } from "@prisma/client";
import { compare } from "bcryptjs";
import { hasCurrentLegalConsent } from "@/lib/legal-consent";
import NextAuth, { CredentialsSignin } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import * as Sentry from "@sentry/nextjs";

async function anonymizeUserId(userId: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(userId));
  return Array.from(new Uint8Array(digest))
    .slice(0, 12)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

class PendingApprovalError extends CredentialsSignin {
  code = "pending_approval";
}

class SuspendedAccountError extends CredentialsSignin {
  code = "account_suspended";
}

class BannedAccountError extends CredentialsSignin {
  code = "account_banned";
}

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    ...(authConfig.providers ?? []),
    Credentials({
      id: "credentials",
      name: "Email e senha",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            status: true,
            acceptedTermsAt: true,
            acceptedPrivacyAt: true,
            acceptedTermsVersion: true,
            acceptedPrivacyVersion: true,
          },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const passwordMatches = await compare(password, user.passwordHash);
        if (!passwordMatches) {
          return null;
        }

        if (user.status === UserStatus.PENDING) {
          throw new PendingApprovalError();
        }

        if (user.status === UserStatus.SUSPENDED) {
          throw new SuspendedAccountError();
        }

        if (user.status === UserStatus.BANNED) {
          throw new BannedAccountError();
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          needsLegalConsent: !hasCurrentLegalConsent(user),
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? null;
        token.status = user.status ?? UserStatus.PENDING;
        token.needsLegalConsent = user.needsLegalConsent ?? true;
        token.roleSyncedAt = Date.now();
        return token;
      }

      const tokenUserId =
        (typeof token.id === "string" && token.id.length > 0 ? token.id : token.sub) ?? null;

      if (!tokenUserId) {
        return token;
      }

      // Authorization state is security-sensitive. Re-read it for every
      // server-side session resolution so suspension, banning, role changes
      // and new legal versions take effect on the next protected request.
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: tokenUserId },
          select: {
            role: true,
            status: true,
            acceptedTermsAt: true,
            acceptedPrivacyAt: true,
            acceptedTermsVersion: true,
            acceptedPrivacyVersion: true,
          },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.needsLegalConsent = !hasCurrentLegalConsent(dbUser);
        }
      } catch (error) {
        // console.error used intentionally here — auth.ts runs in edge/middleware context
        // where our server-side logger import is not available
        console.warn("[auth] Failed to sync auth token role/status", String(error));
      } finally {
        token.roleSyncedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub ?? session.user.id) as string;
        session.user.role = (token.role ?? null) as typeof session.user.role;
        session.user.status = (token.status ?? UserStatus.PENDING) as typeof session.user.status;
        session.user.needsLegalConsent = token.needsLegalConsent ?? true;
        const userId = session.user.id;
        if (userId) Sentry.setUser({ id: await anonymizeUserId(userId) });
      }

      return session;
    },
    async signIn({ user, account }) {
      if (!user.email) {
        return false;
      }

      // Credentials provider: status checks are already handled inside
      // authorize() which throws PendingApprovalError / SuspendedAccountError /
      // BannedAccountError with specific codes. Re-checking here would cause
      // NextAuth to swallow those errors and emit a generic "CredentialsSignin",
      // which would show "Email ou senha inválidos" instead of the real message.
      if (account?.provider === "credentials") {
        return true;
      }

      // For OAuth providers (Google, etc): enforce ACTIVE status.
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { status: true },
      });

      return !dbUser || dbUser.status === UserStatus.ACTIVE;
    },
  },
});
