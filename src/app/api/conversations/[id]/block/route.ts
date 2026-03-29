import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { UserRole } from "@prisma/client";
import { z } from "zod";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const conversationBlockSchema = z.object({
  blocked: z.boolean(),
});

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;

  const authResult = await requireUser([UserRole.FAMILY, UserRole.PROFESSIONAL]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, conversationBlockSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      familyId: true,
      professionalId: true,
      isBlockedByFamily: true,
      isBlockedByProfessional: true,
    },
  });

  if (!conversation) {
    return fail(404, "Conversation not found");
  }

  if (
    authResult.user.id !== conversation.familyId &&
    authResult.user.id !== conversation.professionalId
  ) {
    return fail(403, "You cannot update this conversation");
  }

  const blocked = bodyResult.data.blocked;
  const updateData =
    authResult.user.id === conversation.familyId
      ? { isBlockedByFamily: blocked }
      : { isBlockedByProfessional: blocked };

  const updated = await prisma.conversation.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      isBlockedByFamily: true,
      isBlockedByProfessional: true,
    },
  });

  return ok({
    conversation: updated,
    blockedBySelf:
      authResult.user.id === conversation.familyId
        ? updated.isBlockedByFamily
        : updated.isBlockedByProfessional,
  });
}
