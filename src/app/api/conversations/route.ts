import { requireUser } from "@/lib/auth-guard";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(request: Request) {
  const authResult = await requireUser([UserRole.FAMILY, UserRole.PROFESSIONAL, UserRole.ADMIN], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const where =
    authResult.user.role === UserRole.ADMIN
      ? {}
      : authResult.user.role === UserRole.FAMILY
        ? { familyId: authResult.user.id }
        : { professionalId: authResult.user.id };

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          serviceType: true,
        },
      },
      family: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
          phone: true,
        },
      },
      professional: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
          phone: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          content: true,
          senderId: true,
          createdAt: true,
        },
      },
    },
    take: authResult.user.role === UserRole.ADMIN ? 200 : 100,
  });

  const conversationIds = conversations.map((c) => c.id);

  const unread =
    conversationIds.length === 0
      ? []
      : await prisma.message.groupBy({
          by: ["conversationId"],
          where: {
            conversationId: { in: conversationIds },
            readAt: null,
            senderId: { not: authResult.user.id },
          },
          _count: {
            conversationId: true,
          },
        });

  const unreadMap = new Map(
    unread.map((item) => [item.conversationId, item._count.conversationId]),
  );

  return ok({
    items: conversations.map((conversation) => ({
      ...conversation,
      unreadCount: unreadMap.get(conversation.id) ?? 0,
      counterpart:
        authResult.user.role === UserRole.FAMILY
          ? conversation.professional
          : conversation.family,
    })),
  });
}
