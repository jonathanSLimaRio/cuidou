import { requireUser } from "@/lib/auth-guard";
import { resolveQuickReply } from "@/lib/chat-quick-replies";
import { sendEmail } from "@/lib/email";
import { fail, ok } from "@/lib/http";
import { notifyUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { messageSchema } from "@/lib/schemas";
import { del, put } from "@vercel/blob";
import { MessageKind, NotificationType, UserRole } from "@prisma/client";

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

  if (attachmentFiles.length > 0 && !process.env.BLOB_READ_WRITE_TOKEN) {
    return fail(500, "BLOB_READ_WRITE_TOKEN is not configured");
  }

  const uploadedAttachments: Array<{
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
      const upload = await put(
        `chat/${conversationId}/${Date.now()}-${index}-${safeName}`,
        file,
        {
          access: "private",
          contentType: file.type,
        },
      );

      uploadedAttachments.push({
        pathname: upload.pathname,
        url: upload.url,
        downloadUrl: upload.downloadUrl,
        mimeType: file.type,
        sizeBytes: file.size,
        fileName: safeName,
      });
    }
  } catch (error) {
    if (uploadedAttachments.length > 0) {
      try {
        await del(uploadedAttachments.map((item) => item.pathname));
      } catch (cleanupError) {
        console.error("Failed to cleanup uploaded attachments", cleanupError);
      }
    }

    console.error("Attachment upload failed", error);
    return fail(500, "Failed to upload attachments");
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
          data: uploadedAttachments.map((attachment) => ({
            messageId: createdMessage.id,
            pathname: attachment.pathname,
            url: attachment.url,
            downloadUrl: attachment.downloadUrl,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
            fileName: attachment.fileName,
          })),
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
        await del(uploadedAttachments.map((item) => item.pathname));
      } catch (cleanupError) {
        console.error("Failed to cleanup uploaded attachments after DB error", cleanupError);
      }
    }

    console.error("Message transaction failed", error);
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

  return ok({ message }, 201);
}
