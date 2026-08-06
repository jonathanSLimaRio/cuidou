import { auth } from "@/auth";
import { getAuthSecret } from "@/lib/env";
import { fail } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { getMobileUserFromBearer } from "@/lib/mobile-auth";
import { hasCurrentLegalConsent } from "@/lib/legal-consent";

export type CurrentUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: UserRole | null;
  status: UserStatus;
  needsLegalConsent: boolean;
};

const authSecret = getAuthSecret();

function buildCurrentUser(user: {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: UserRole | null;
  status?: UserStatus;
  needsLegalConsent?: boolean;
}): CurrentUser {
  return {
    id: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    role: user.role ?? null,
    status: user.status ?? UserStatus.PENDING,
    needsLegalConsent: user.needsLegalConsent ?? false,
  };
}

async function getUserFromBearer(request?: Request): Promise<CurrentUser | null> {
  if (!request || !authSecret) {
    return null;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const mobileUser = await getMobileUserFromBearer(request);
  if (mobileUser) {
    return buildCurrentUser(mobileUser);
  }

  let token;
  try {
    token = await getToken({
      req: request as never,
      secret: authSecret,
      secureCookie: process.env.NODE_ENV === "production",
    });
  } catch {
    return null;
  }

  const userId =
    (typeof token?.id === "string" && token.id.length > 0 ? token.id : token?.sub) ?? null;

  if (!userId) {
    return null;
  }

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

  if (!user) {
    return null;
  }

  return buildCurrentUser({
    ...user,
    needsLegalConsent: !hasCurrentLegalConsent(user),
  });
}

export async function requireUser(roles?: UserRole[], request?: Request) {
  const session = await auth();
  const user = session?.user;
  const hasBearer = request?.headers.get("authorization")?.toLowerCase().startsWith("bearer ") ?? false;

  // An explicit Bearer credential must take precedence over a browser cookie.
  // Otherwise a request carrying an invalid/low-privilege mobile token could
  // accidentally inherit a different user's web session on the same origin.
  const currentUser = hasBearer
    ? await getUserFromBearer(request)
    : user?.id
      ? buildCurrentUser(user)
      : null;

  if (!currentUser?.id) {
    return { response: fail(401, "Unauthorized") } as const;
  }

  if (currentUser.status !== UserStatus.ACTIVE) {
    return { response: fail(403, "User account is not active") } as const;
  }

  const pathname = request ? new URL(request.url).pathname : "";
  const isConsentEndpoint =
    pathname === "/api/legal/consent" || pathname === "/api/onboarding/role";
  if (currentUser.needsLegalConsent && !isConsentEndpoint) {
    return { response: fail(403, "Current legal consent is required") } as const;
  }

  if (roles?.length && (!currentUser.role || !roles.includes(currentUser.role))) {
    return { response: fail(403, "Insufficient permissions") } as const;
  }

  return { user: currentUser } as const;
}

export function isAdmin(user: CurrentUser) {
  return user.role === UserRole.ADMIN;
}
