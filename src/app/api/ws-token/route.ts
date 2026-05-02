import { requireUser } from "@/lib/auth-guard";
import { createConversationTokenRequest } from "@/lib/ably";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(request: Request) {
  const authResult = await requireUser(
    [UserRole.FAMILY, UserRole.PROFESSIONAL, UserRole.ADMIN],
    request,
  );
  if ("response" in authResult) return authResult.response;

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) return fail(422, "conversationId is required");

  // Verify access (admins bypass this check in the WS server via role field in token)
  if (authResult.user.role !== UserRole.ADMIN) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ familyId: authResult.user.id }, { professionalId: authResult.user.id }],
      },
      select: { id: true },
    });

    if (!conversation) return fail(404, "Conversation not found or access denied");
  }

  const tokenRequest = await createConversationTokenRequest(authResult.user.id, conversationId);

  return ok({ tokenRequest });
}
