import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import { uploadMediaToWordPress } from "@/lib/wordpress-media";
import {
  DocumentType,
  NotificationType,
  UserRole,
  VerificationStatus,
} from "@prisma/client";
import { z } from "zod";

const documentTypeSchema = z.enum([
  "IDENTITY",
  "BACKGROUND_CHECK",
  "CERTIFICATION",
  "OTHER",
]);

export async function POST(request: Request) {
  const authResult = await requireUser([UserRole.PROFESSIONAL]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: authResult.user.id },
    select: { id: true },
  });

  if (!profile) {
    return fail(404, "Professional profile not found");
  }

  const formData = await request.formData();
  const type = formData.get("documentType");
  const fileField = formData.get("file");

  const parsedType = documentTypeSchema.safeParse(type);
  if (!parsedType.success) {
    return fail(422, "Invalid documentType");
  }

  let fileUrl = "";

  if (fileField instanceof File) {
    try {
      const arrayBuffer = await fileField.arrayBuffer();
      const upload = await uploadMediaToWordPress({
        buffer: new Uint8Array(arrayBuffer),
        fileName: fileField.name,
        mimeType: fileField.type || "application/octet-stream",
        folderTag: `documents-${authResult.user.id}`,
        title: `document-${parsedType.data.toLowerCase()}`,
      });

      fileUrl = upload.sourceUrl;
    } catch (error) {
      console.error("Document upload to WordPress failed", error);
      return fail(502, "Failed to upload document to WordPress");
    }
  } else if (typeof fileField === "string" && fileField.length > 0) {
    fileUrl = fileField;
  } else {
    return fail(422, "You must provide a file or file URL");
  }

  const document = await prisma.professionalDocument.create({
    data: {
      professionalProfileId: profile.id,
      documentType: parsedType.data as DocumentType,
      fileUrl,
      status: VerificationStatus.UNDER_REVIEW,
    },
  });

  await prisma.professionalProfile.update({
    where: { id: profile.id },
    data: {
      verificationStatus: VerificationStatus.UNDER_REVIEW,
    },
  });

  await notifyUser({
    userId: authResult.user.id,
    type: NotificationType.DOCUMENT_STATUS_UPDATED,
    title: "Documento enviado",
    body: "Seu documento foi enviado e está em análise.",
  });

  return ok({ document }, 201);
}
