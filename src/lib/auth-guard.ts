import { auth } from "@/auth";
import { fail } from "@/lib/http";
import { UserRole, UserStatus } from "@prisma/client";

export type CurrentUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: UserRole | null;
  status: UserStatus;
};

export async function requireUser(roles?: UserRole[]) {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    return { response: fail(401, "Unauthorized") } as const;
  }

  const currentUser: CurrentUser = {
    id: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    role: user.role ?? null,
    status: user.status ?? UserStatus.ACTIVE,
  };

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
