import authConfig from "@/auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { UserStatus } from "@prisma/client";
import { compare } from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";

const ROLE_SYNC_INTERVAL_MS = 60 * 1000;

class PendingApprovalError extends CredentialsSignin {
  code = "pending_approval";
}

class SuspendedAccountError extends CredentialsSignin {
  code = "account_suspended";
}

class BannedAccountError extends CredentialsSignin {
  code = "account_banned";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
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
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? null;
        token.status = user.status ?? UserStatus.ACTIVE;
        token.roleSyncedAt = Date.now();
        return token;
      }

      const tokenUserId =
        (typeof token.id === "string" && token.id.length > 0 ? token.id : token.sub) ?? null;

      if (!tokenUserId) {
        return token;
      }

      const lastSync = typeof token.roleSyncedAt === "number" ? token.roleSyncedAt : 0;
      const shouldSync =
        trigger === "update" ||
        token.role == null ||
        token.status !== UserStatus.ACTIVE ||
        Date.now() - lastSync > ROLE_SYNC_INTERVAL_MS;

      if (!shouldSync) {
        return token;
      }

      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: tokenUserId },
          select: {
            role: true,
            status: true,
          },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.status = dbUser.status;
        }
      } catch (error) {
        console.error("Failed to sync auth token role/status", error);
      } finally {
        token.roleSyncedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub ?? session.user.id) as string;
        session.user.role = (token.role ?? null) as typeof session.user.role;
        session.user.status = (token.status ?? UserStatus.ACTIVE) as typeof session.user.status;
      }

      return session;
    },
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { status: true },
      });

      return !dbUser || dbUser.status === UserStatus.ACTIVE;
    },
  },
});
