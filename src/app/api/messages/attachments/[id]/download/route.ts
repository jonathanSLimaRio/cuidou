import { requireUser } from "@/lib/auth-guard";
import { fail } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { get } from "@vercel/blob";
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

  const blob = await get(attachment.pathname, { access: "private" });

  if (!blob || blob.statusCode === 304 || !blob.stream) {
    return fail(404, "File not found in storage");
  }

  return new Response(blob.stream, {
    status: 200,
    headers: {
      "Content-Type": blob.blob.contentType ?? attachment.mimeType,
      "Content-Disposition": `attachment; filename=\"${sanitizeFileName(attachment.fileName)}\"`,
      "Cache-Control": "private, no-store",
    },
  });
}
