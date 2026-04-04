import { requireUser } from "@/lib/auth-guard";
import { fail } from "@/lib/http";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  extractWordPressMediaId,
  fetchWordPressMediaBinary,
  isLocalUploadRef,
} from "@/lib/wordpress-media";
import { UserRole } from "@prisma/client";

type Params = {
  params: Promise<{ id: string }>;
};

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;

  const authResult = await requireUser([UserRole.FAMILY, UserRole.PROFESSIONAL, UserRole.ADMIN]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const attachment = await prisma.messageAttachment.findUnique({
    where: { id },
    include: {
      message: {
        select: {
          conversation: {
            select: {
              familyId: true,
              professionalId: true,
            },
          },
        },
      },
    },
  });

  if (!attachment) {
    return fail(404, "Attachment not found");
  }

  const canAccess =
    authResult.user.role === UserRole.ADMIN ||
    authResult.user.id === attachment.message.conversation.familyId ||
    authResult.user.id === attachment.message.conversation.professionalId;

  if (!canAccess) {
    return fail(403, "You cannot access this attachment");
  }

  const mediaId = extractWordPressMediaId(attachment.pathname);
  const isLocal = isLocalUploadRef(attachment.pathname);

  if (!mediaId && !isLocal) {
    return fail(410, "Attachment points to a legacy storage format");
  }

  try {
    const file = await fetchWordPressMediaBinary(attachment.url);

    return new Response(file.stream, {
      status: 200,
      headers: {
        "Content-Type": file.contentType ?? attachment.mimeType,
        "Content-Disposition": `attachment; filename=\"${sanitizeFileName(attachment.fileName)}\"`,
        "Cache-Control": "private, no-store",
        ...(file.contentLength
          ? {
              "Content-Length": file.contentLength,
            }
          : {}),
      },
    });
  } catch (error) {
    logger.error("Failed to fetch attachment binary for protected download", error, {
      attachmentId: attachment.id,
      mediaId,
      pathname: attachment.pathname,
    });
    return fail(502, "Failed to fetch file");
  }
}
