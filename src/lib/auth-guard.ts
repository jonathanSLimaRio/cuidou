import { auth } from "@/auth";
import { getAuthSecret } from "@/lib/env";
import { fail } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";
import { getToken } from "next-auth/jwt";

export type CurrentUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: UserRole | null;
  status: UserStatus;
};

const authSecret = getAuthSecret();

function buildCurrentUser(user: {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: UserRole | null;
  status?: UserStatus;
}): CurrentUser {
  return {
    id: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    role: user.role ?? null,
    status: user.status ?? UserStatus.ACTIVE,
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

  const token = await getToken({
    req: request as never,
    secret: authSecret,
    secureCookie: process.env.NODE_ENV === "production",
  });

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
    },
  });

  if (!user) {
    return null;
  }

  return buildCurrentUser(user);
}

export async function requireUser(roles?: UserRole[], request?: Request) {
  const session = await auth();
  const user = session?.user;

  const currentUser = user?.id ? buildCurrentUser(user) : await getUserFromBearer(request);

  if (!currentUser?.id) {
    return { response: fail(401, "Unauthorized") } as const;
  }

  if (currentUser.status !== UserStatus.ACTIVE) {
    return { response: fail(403, "User account is not active") } as const;
  }

  if (roles?.length && (!currentUser.role || !roles.includes(currentUser.role))) {
    return { response: fail(403, "Insufficient permissions") } as const;
  }

  return { user: currentUser } as const;
}

export function isAdmin(user: CurrentUser) {
  return user.role === UserRole.ADMIN;
}
