import { requireUser } from "@/lib/auth-guard";
import { sendEmail } from "@/lib/email";
import { fail, ok } from "@/lib/http";
import { notifyUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { messageSchema } from "@/lib/schemas";
import { NotificationType, UserRole } from "@prisma/client";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

function canAccessConversation(userId: string, familyId: string, professionalId: string) {
  return userId === familyId || userId === professionalId;
}

export async function GET(request: Request, { params }: Params) {
  const { id: conversationId } = await params;

  const authResult = await requireUser([UserRole.FAMILY, UserRole.PROFESSIONAL, UserRole.ADMIN]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      familyId: true,
      professionalId: true,
    },
  });

  if (!conversation) {
    return fail(404, "Conversation not found");
  }

  if (
    authResult.user.role !== UserRole.ADMIN &&
    !canAccessConversation(
      authResult.user.id,
      conversation.familyId,
      conversation.professionalId,
    )
  ) {
    return fail(403, "You cannot access this conversation");
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const take = Math.min(Math.max(Number(searchParams.get("take") ?? "20"), 1), 50);

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: take + 1,
    ...(cursor
      ? {
          cursor: {
            id: cursor,
          },
          skip: 1,
        }
      : {}),
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  const hasMore = messages.length > take;
  const sliced = hasMore ? messages.slice(0, take) : messages;

  await prisma.message.updateMany({
    where: {
      conversationId,
      readAt: null,
      senderId: {
        not: authResult.user.id,
      },
    },
    data: {
      readAt: new Date(),
    },
  });

  return ok({
    items: [...sliced].reverse(),
    nextCursor: hasMore ? sliced[sliced.length - 1]?.id : null,
  });
}

export async function POST(request: Request, { params }: Params) {
  const { id: conversationId } = await params;

  const authResult = await requireUser([UserRole.FAMILY, UserRole.PROFESSIONAL]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, messageSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      family: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      professional: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!conversation) {
    return fail(404, "Conversation not found");
  }

  if (
    !canAccessConversation(
      authResult.user.id,
      conversation.familyId,
      conversation.professionalId,
    )
  ) {
    return fail(403, "You cannot access this conversation");
  }

  if (
    (authResult.user.id === conversation.familyId && conversation.isBlockedByFamily) ||
    (authResult.user.id === conversation.professionalId &&
      conversation.isBlockedByProfessional)
  ) {
    return fail(403, "You blocked this conversation");
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: authResult.user.id,
      content: bodyResult.data.content,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  const recipientId =
    authResult.user.id === conversation.familyId
      ? conversation.professionalId
      : conversation.familyId;

  const recipientEmail =
    authResult.user.id === conversation.familyId
      ? conversation.professional.email
      : conversation.family.email;

  await notifyUser({
    userId: recipientId,
    type: NotificationType.CHAT_MESSAGE,
    title: "Nova mensagem",
    body: "Você recebeu uma nova mensagem no chat.",
    data: {
      conversationId,
      messageId: message.id,
    },
  });

  if (recipientEmail) {
    await sendEmail({
      to: recipientEmail,
      subject: "Nova mensagem no chat da Cuidou",
      html: `<p>Você recebeu uma nova mensagem no chat.</p>`,
    });
  }

  return ok({ message }, 201);
}
