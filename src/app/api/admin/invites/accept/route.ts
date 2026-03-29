import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";

const acceptAdminInviteSchema = z.object({
  token: z.string().min(12).max(200),
});

export async function POST(request: Request) {
  const authResult = await requireUser();
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, acceptAdminInviteSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  if (!authResult.user.email) {
    return fail(400, "User session does not contain a valid email");
  }

  const token = bodyResult.data.token.trim();

  const invite = await prisma.adminInvite.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      expiresAt: true,
      acceptedAt: true,
    },
  });

  if (!invite) {
    return fail(404, "Invite token not found");
  }

  if (invite.acceptedAt) {
    return fail(409, "Invite token already used");
  }

  if (invite.expiresAt.getTime() < Date.now()) {
    return fail(410, "Invite token expired");
  }

  if (invite.email.toLowerCase() !== authResult.user.email.toLowerCase()) {
    return fail(403, "Invite token does not match your authenticated email");
  }

  const now = new Date();

  const updatedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: authResult.user.id },
      data: {
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    await tx.adminInvite.update({
      where: { id: invite.id },
      data: {
        acceptedAt: now,
      },
    });

    return user;
  });

  return ok({
    user: updatedUser,
    acceptedAt: now.toISOString(),
    nextPath: "/admin",
  });
}
