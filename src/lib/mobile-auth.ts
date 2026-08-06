import { createHash, randomBytes } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

import { getAuthSecret } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { hasCurrentLegalConsent } from "@/lib/legal-consent";

export const MOBILE_ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const MOBILE_REFRESH_TOKEN_TTL_DAYS = 30;

const MOBILE_ACCESS_TOKEN_TYPE = "cuidou-mobile-access";
const accessTokenSecret = new TextEncoder().encode(getAuthSecret());

export type MobileUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: UserRole | null;
  status: UserStatus;
  needsLegalConsent: boolean;
};

export class MobileAuthError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "MobileAuthError";
    this.status = status;
    this.code = code;
  }
}

export function mobileAuthErrorResponse(error: unknown) {
  if (error instanceof MobileAuthError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }

  return NextResponse.json(
    { error: "Não foi possível concluir a autenticação.", code: "auth_unavailable" },
    { status: 500 },
  );
}

export function hashMobileRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createRefreshToken() {
  return randomBytes(48).toString("base64url");
}

export function toMobileUser(user: MobileUser) {
  return {
    id: user.id,
    email: user.email ?? "",
    name: user.name,
    role: user.role,
    status: user.status,
    needsLegalConsent: user.needsLegalConsent,
  };
}

export async function signMobileAccessToken(user: MobileUser) {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    tokenType: MOBILE_ACCESS_TOKEN_TYPE,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MOBILE_ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(accessTokenSecret);
}

export async function verifyMobileAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, accessTokenSecret, {
      algorithms: ["HS256"],
    });

    if (payload.tokenType !== MOBILE_ACCESS_TOKEN_TYPE || typeof payload.sub !== "string") {
      return null;
    }

    return { userId: payload.sub };
  } catch {
    return null;
  }
}

async function findMobileUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      acceptedTermsAt: true,
      acceptedPrivacyAt: true,
      acceptedTermsVersion: true,
      acceptedPrivacyVersion: true,
    },
  });
  return user ? { ...user, needsLegalConsent: !hasCurrentLegalConsent(user) } : null;
}

export async function getMobileUserFromBearer(request: Request): Promise<MobileUser | null> {
  const header = request.headers.get("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = header.slice(7).trim();
  if (!token) {
    return null;
  }

  const verified = await verifyMobileAccessToken(token);
  if (!verified) {
    return null;
  }

  return findMobileUser(verified.userId);
}

export async function requireMobileUser(request: Request, roles?: UserRole[]) {
  const user = await getMobileUserFromBearer(request);

  if (!user) {
    throw new MobileAuthError(401, "unauthorized", "Unauthorized");
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new MobileAuthError(403, "account_inactive", "User account is not active");
  }

  if (roles?.length && (!user.role || !roles.includes(user.role))) {
    throw new MobileAuthError(403, "forbidden", "Insufficient permissions");
  }

  return user;
}

export async function authenticateMobilePassword(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
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
    throw new MobileAuthError(401, "credentials_invalid", "Email ou senha inválidos.");
  }

  const { compare } = await import("bcryptjs");
  if (!(await compare(password, user.passwordHash))) {
    throw new MobileAuthError(401, "credentials_invalid", "Email ou senha inválidos.");
  }

  if (user.status === UserStatus.PENDING) {
    throw new MobileAuthError(403, "pending_approval", "Sua conta está pendente de aprovação.");
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new MobileAuthError(403, "account_suspended", "Sua conta está suspensa.");
  }

  if (user.status === UserStatus.BANNED) {
    throw new MobileAuthError(403, "account_banned", "Sua conta foi banida.");
  }

  return { ...user, needsLegalConsent: !hasCurrentLegalConsent(user) };
}

export async function createMobileSession(user: MobileUser) {
  const refreshToken = createRefreshToken();
  const expiresAt = new Date(
    Date.now() + MOBILE_REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.mobileRefreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashMobileRefreshToken(refreshToken),
      expiresAt,
    },
  });

  return {
    accessToken: await signMobileAccessToken(user),
    refreshToken,
    user: toMobileUser(user),
    accessTokenExpiresIn: MOBILE_ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenExpiresAt: expiresAt.toISOString(),
  };
}

export async function rotateMobileSession(refreshToken: string) {
  const tokenHash = hashMobileRefreshToken(refreshToken);
  const stored = await prisma.mobileRefreshToken.findUnique({
    where: { tokenHash },
  });

  if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
    throw new MobileAuthError(401, "refresh_token_invalid", "Refresh token inválido ou expirado.");
  }

  const user = await findMobileUser(stored.userId);
  if (!user) {
    throw new MobileAuthError(401, "refresh_token_invalid", "Refresh token inválido.");
  }

  if (user.status !== UserStatus.ACTIVE) {
    await prisma.mobileRefreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date(), lastUsedAt: new Date() },
    });
    throw new MobileAuthError(403, "account_inactive", "User account is not active");
  }

  const nextRefreshToken = createRefreshToken();
  const nextTokenHash = hashMobileRefreshToken(nextRefreshToken);
  const nextExpiresAt = new Date(
    Date.now() + MOBILE_REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  const rotated = await prisma.$transaction(async (tx) => {
    const revoked = await tx.mobileRefreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
        replacedByTokenHash: nextTokenHash,
      },
    });

    if (revoked.count !== 1) {
      throw new MobileAuthError(401, "refresh_token_reused", "Refresh token já utilizado.");
    }

    await tx.mobileRefreshToken.create({
      data: {
        userId: user.id,
        tokenHash: nextTokenHash,
        expiresAt: nextExpiresAt,
      },
    });

    return true;
  });

  if (!rotated) {
    throw new MobileAuthError(401, "refresh_token_invalid", "Refresh token inválido.");
  }

  return {
    accessToken: await signMobileAccessToken(user),
    refreshToken: nextRefreshToken,
    user: toMobileUser(user),
    accessTokenExpiresIn: MOBILE_ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenExpiresAt: nextExpiresAt.toISOString(),
  };
}

export async function revokeMobileRefreshToken(refreshToken: string | null | undefined) {
  if (!refreshToken) {
    return;
  }

  await prisma.mobileRefreshToken.updateMany({
    where: { tokenHash: hashMobileRefreshToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date(), lastUsedAt: new Date() },
  });
}
