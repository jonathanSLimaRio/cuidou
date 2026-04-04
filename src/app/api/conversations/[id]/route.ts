import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  const authResult = await requireUser([UserRole.FAMILY, UserRole.PROFESSIONAL, UserRole.ADMIN]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      familyId: true,
      professionalId: true,
      isBlockedByFamily: true,
      isBlockedByProfessional: true,
      job: {
        select: { id: true, title: true, serviceType: true },
      },
      family: {
        select: { id: true, name: true, image: true, email: true, phone: true },
      },
      professional: {
        select: { id: true, name: true, image: true, email: true, phone: true },
      },
    },
  });

  if (!conversation) {
    return fail(404, "Conversation not found");
  }

  if (
    authResult.user.role !== UserRole.ADMIN &&
    authResult.user.id !== conversation.familyId &&
    authResult.user.id !== conversation.professionalId
  ) {
    return fail(403, "You cannot access this conversation");
  }

  const blockedBySelf =
    authResult.user.id === conversation.familyId
      ? conversation.isBlockedByFamily
      : authResult.user.id === conversation.professionalId
        ? conversation.isBlockedByProfessional
        : false;

  const counterpart =
    authResult.user.role === UserRole.FAMILY ? conversation.professional : conversation.family;

  return ok({ ...conversation, blockedBySelf, counterpart });
}
