import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import { put } from "@vercel/blob";
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
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return fail(500, "BLOB_READ_WRITE_TOKEN is not configured");
    }

    const upload = await put(
      `documents/${authResult.user.id}/${Date.now()}-${fileField.name}`,
      fileField,
      {
        access: "private",
      },
    );

    fileUrl = upload.url;
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
