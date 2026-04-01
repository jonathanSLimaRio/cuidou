import { requireUser } from "@/lib/auth-guard";
import { resolveQuickReply } from "@/lib/chat-quick-replies";
import { sendEmail } from "@/lib/email";
import { fail, ok } from "@/lib/http";
import { logger } from "@/lib/logger";
import { notifyUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { checkRateLimit, rateLimitHeaders, rateLimitKey } from "@/lib/rate-limiter";
import { messageSchema } from "@/lib/schemas";
import {
  deleteWordPressMedia,
  uploadMediaToWordPress,
} from "@/lib/wordpress-media";
import { MessageKind, NotificationType, UserRole } from "@prisma/client";

const MSG_RATE_LIMIT = { max: 30, windowMs: 5 * 60 * 1000 }; // 30 per 5 min

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const MAX_ATTACHMENTS_PER_MESSAGE = 3;
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

function canAccessConversation(userId: string, familyId: string, professionalId: string) {
  return userId === familyId || userId === professionalId;
}

function isAllowedAttachmentMime(mimeType: string) {
  return mimeType.startsWith("image/") || mimeType === "application/pdf";
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function toPublicAttachment(
  attachment: {
    id: string;
    fileName: string;
    sizeBytes: number;
    mimeType: string;
    downloadUrl: string;
    createdAt: Date;
  },
) {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    sizeBytes: attachment.sizeBytes,
    mimeType: attachment.mimeType,
    downloadUrl: attachment.downloadUrl,
    createdAt: attachment.createdAt,
  };
}

function toPublicMessage<T extends { attachments: Parameters<typeof toPublicAttachment>[0][] }>(
  message: T,
) {
  return {
    ...message,
    attachments: message.attachments.map(toPublicAttachment),
  };
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
    !canAccessConversation(authResult.user.id, conversation.familyId, conversation.professionalId)
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
      attachments: {
        orderBy: {
          createdAt: "asc",
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
    items: [...sliced].reverse().map(toPublicMessage),
    nextCursor: hasMore ? sliced[sliced.length - 1]?.id : null,
  });
}

export async function POST(request: Request, { params }: Params) {
  const { id: conversationId } = await params;

  const rlKey = rateLimitKey(`messages-${conversationId}`, request);
  const rl = checkRateLimit(rlKey, MSG_RATE_LIMIT);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many messages. Please slow down." }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        ...rateLimitHeaders(rl, MSG_RATE_LIMIT.max),
      },
    });
  }

  const authResult = await requireUser([UserRole.FAMILY, UserRole.PROFESSIONAL]);
  if ("response" in authResult) {
    return authResult.response;
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
    !canAccessConversation(authResult.user.id, conversation.familyId, conversation.professionalId)
  ) {
    return fail(403, "You cannot access this conversation");
  }

  if (
    (authResult.user.id === conversation.familyId && conversation.isBlockedByFamily) ||
    (authResult.user.id === conversation.professionalId && conversation.isBlockedByProfessional)
  ) {
    return fail(403, "You blocked this conversation");
  }

  const contentType = request.headers.get("content-type") ?? "";
  let messageContent = "";
  let quickReplyKey: string | undefined;
  let attachmentFiles: File[] = [];

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();

    const rawContent = formData.get("content");
    messageContent = typeof rawContent === "string" ? rawContent.trim() : "";

    const rawQuickReplyKey = formData.get("quickReplyKey");
    quickReplyKey =
      typeof rawQuickReplyKey === "string" && rawQuickReplyKey.trim().length > 0
        ? rawQuickReplyKey.trim()
        : undefined;

    attachmentFiles = formData
      .getAll("attachments")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  } else {
    const bodyResult = await parseJsonBody(request, messageSchema);
    if ("response" in bodyResult) {
      return bodyResult.response;
    }

    messageContent = bodyResult.data.content?.trim() ?? "";
    quickReplyKey = bodyResult.data.quickReplyKey?.trim();
  }

  const quickReply = quickReplyKey
    ? resolveQuickReply(authResult.user.role, quickReplyKey)
    : null;

  if (quickReplyKey && !quickReply) {
    return fail(422, "Invalid quickReplyKey for your role");
  }

  if (!messageContent && quickReply) {
    messageContent = quickReply.text;
  }

  if (attachmentFiles.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    return fail(
      422,
      `You can upload at most ${MAX_ATTACHMENTS_PER_MESSAGE} attachments per message`,
    );
  }

  for (const file of attachmentFiles) {
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      return fail(422, `${file.name} exceeds the 10MB limit`);
    }

    if (!isAllowedAttachmentMime(file.type)) {
      return fail(422, `${file.name} has an unsupported file type`);
    }
  }

  if (!messageContent && attachmentFiles.length === 0) {
    return fail(422, "A message must contain text, quick reply, or attachments");
  }

  const uploadedAttachments: Array<{
    id: string;
    mediaId: number;
    pathname: string;
    url: string;
    downloadUrl: string;
    mimeType: string;
    sizeBytes: number;
    fileName: string;
  }> = [];

  try {
    for (const [index, file] of attachmentFiles.entries()) {
      const safeName = sanitizeFileName(file.name);
      const upload = await uploadMediaToWordPress({
        buffer: new Uint8Array(await file.arrayBuffer()),
        fileName: safeName,
        mimeType: file.type || "application/octet-stream",
        folderTag: `chat-${conversationId}`,
        title: `chat-${conversationId}-${Date.now()}-${index}`,
      });

      uploadedAttachments.push({
        id: crypto.randomUUID(),
        mediaId: upload.mediaId,
        pathname: `wp-media:${upload.mediaId}`,
        url: upload.sourceUrl,
        downloadUrl: "",
        mimeType: upload.mimeType || file.type,
        sizeBytes: upload.sizeBytes || file.size,
        fileName: safeName,
      });
    }
  } catch (error) {
    if (uploadedAttachments.length > 0) {
      try {
        await Promise.all(
          uploadedAttachments.map((item) => deleteWordPressMedia(item.mediaId)),
        );
      } catch (cleanupError) {
        logger.error("Failed to cleanup uploaded attachments", cleanupError);
      }
    }

    logger.error("Attachment upload to WordPress failed", error);
    return fail(502, "Failed to upload attachments");
  }

  const kind = quickReply
    ? MessageKind.QUICK_REPLY
    : uploadedAttachments.length > 0
      ? MessageKind.TEXT_WITH_ATTACHMENTS
      : MessageKind.TEXT;

  let message;

  try {
    message = await prisma.$transaction(async (tx) => {
      const createdMessage = await tx.message.create({
        data: {
          conversationId,
          senderId: authResult.user.id,
          content: messageContent,
          kind,
          quickReplyKey,
        },
      });

      if (uploadedAttachments.length > 0) {
        await tx.messageAttachment.createMany({
          data: uploadedAttachments.map((attachment) => {
            const downloadUrl = `/api/messages/attachments/${attachment.id}/download`;

            return {
              id: attachment.id,
              messageId: createdMessage.id,
              pathname: attachment.pathname,
              url: attachment.url,
              downloadUrl,
              mimeType: attachment.mimeType,
              sizeBytes: attachment.sizeBytes,
              fileName: attachment.fileName,
            };
          }),
        });
      }

      return tx.message.findUniqueOrThrow({
        where: { id: createdMessage.id },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          attachments: true,
        },
      });
    });
  } catch (error) {
    if (uploadedAttachments.length > 0) {
      try {
        await Promise.all(
          uploadedAttachments.map((item) => deleteWordPressMedia(item.mediaId)),
        );
      } catch (cleanupError) {
        logger.error("Failed to cleanup uploaded attachments after DB error", cleanupError);
      }
    }

    logger.error("Message transaction failed", error);
    return fail(500, "Failed to save message");
  }

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
    body:
      uploadedAttachments.length > 0
        ? "Você recebeu uma nova mensagem com anexos no chat."
        : "Você recebeu uma nova mensagem no chat.",
    data: {
      conversationId,
      messageId: message.id,
      hasAttachments: uploadedAttachments.length > 0,
    },
  });

  if (recipientEmail) {
    await sendEmail({
      to: recipientEmail,
      subject: "Nova mensagem no chat da Cuidou",
      html:
        uploadedAttachments.length > 0
          ? `<p>Você recebeu uma nova mensagem com anexos no chat.</p>`
          : `<p>Você recebeu uma nova mensagem no chat.</p>`,
    });
  }

  return ok({ message: toPublicMessage(message) }, 201);
}
