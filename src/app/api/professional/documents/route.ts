import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import {
  DOCUMENT_ALLOWED_EXTENSIONS,
  DOCUMENT_ALLOWED_MIME_TYPES,
  DOCUMENT_MAX_SIZE_BYTES,
  validateFileExtension,
  validateFileSize,
  validateMimeType,
} from "@/lib/file-validation";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import { parsePagination } from "@/lib/request";
import { checkRateLimit, rateLimitHeaders, rateLimitKey } from "@/lib/rate-limiter";
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

const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 }; // 5 per hour

export async function POST(request: Request) {
  // Rate limiting
  const rlKey = rateLimitKey("documents-upload", request);
  const rl = await checkRateLimit(rlKey, RATE_LIMIT);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        ...rateLimitHeaders(rl, RATE_LIMIT.max),
      },
    });
  }

  const authResult = await requireUser([UserRole.PROFESSIONAL], request);
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

  // Reject string URL submissions (SSRF prevention — only accept real file uploads)
  if (typeof fileField === "string") {
    return fail(422, "Direct URL submission is not allowed. Please upload a file.");
  }

  if (!(fileField instanceof File)) {
    return fail(422, "You must provide a file");
  }

  // Validate MIME type
  const mimeResult = validateMimeType(fileField.type, DOCUMENT_ALLOWED_MIME_TYPES);
  if (!mimeResult.ok) {
    return fail(422, mimeResult.error);
  }

  // Validate extension
  const extResult = validateFileExtension(fileField.name, DOCUMENT_ALLOWED_EXTENSIONS);
  if (!extResult.ok) {
    return fail(422, extResult.error);
  }

  // Validate file size
  const sizeResult = validateFileSize(fileField.size, DOCUMENT_MAX_SIZE_BYTES);
  if (!sizeResult.ok) {
    return fail(413, sizeResult.error);
  }

  let fileUrl = "";
  try {
    const arrayBuffer = await fileField.arrayBuffer();
    const upload = await uploadMediaToWordPress({
      buffer: new Uint8Array(arrayBuffer),
      fileName: fileField.name,
      mimeType: fileField.type,
      folderTag: `documents-${authResult.user.id}`,
      title: `document-${parsedType.data.toLowerCase()}`,
    });

    fileUrl = upload.sourceUrl;
  } catch (error) {
    logger.error("Document upload to WordPress failed", error, { userId: authResult.user.id });
    return fail(502, "Failed to upload document to WordPress");
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

export async function GET(request: Request) {
  const authResult = await requireUser([UserRole.PROFESSIONAL], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const { page, pageSize } = parsePagination(searchParams, { defaultPageSize: 20, maxPageSize: 100 });
  const statusParam = searchParams.get("status");
  if (statusParam && !Object.values(VerificationStatus).includes(statusParam as VerificationStatus)) {
    return fail(422, "validation_error", {
      field: "status",
      accepted: Object.values(VerificationStatus),
    });
  }

  const status = statusParam as VerificationStatus | null;

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: authResult.user.id },
    select: { id: true },
  });

  if (!profile) {
    return fail(404, "Professional profile not found");
  }

  const where = {
    professionalProfileId: profile.id,
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.professionalDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.professionalDocument.count({
      where,
    }),
  ]);

  return ok({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}
