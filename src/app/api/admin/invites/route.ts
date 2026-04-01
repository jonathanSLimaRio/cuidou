import { requireUser } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { adminInviteSchema } from "@/lib/schemas";
import { AuditAction, AuditTargetType, UserRole } from "@prisma/client";

export async function GET() {
  const authResult = await requireUser([UserRole.ADMIN]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const items = await prisma.adminInvite.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return ok({ items });
}

export async function POST(request: Request) {
  const authResult = await requireUser([UserRole.ADMIN]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, adminInviteSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const { email, expiresInDays } = bodyResult.data;

  // Prevent duplicate pending invites for the same email
  const existingPending = await prisma.adminInvite.findFirst({
    where: {
      email,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (existingPending) {
    return fail(409, "A pending invite for this email already exists");
  }

  const token = crypto.randomUUID().replaceAll("-", "");
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const invite = await prisma.adminInvite.create({
    data: {
      email,
      token,
      invitedById: authResult.user.id,
      expiresAt,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const acceptUrl = `${appUrl}/admin/invite/accept?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: email,
    subject: "Convite para administracao - Cuidou",
    html: `<p>Voce recebeu um convite para ser admin da plataforma Cuidou.</p><p>Clique no link abaixo para aceitar o convite:</p><p><a href="${acceptUrl}">${acceptUrl}</a></p><p>O link expira em ${expiresInDays} dia(s).</p>`,
  });

  await writeAuditLog({
    adminId: authResult.user.id,
    action: AuditAction.ADMIN_INVITE_CREATED,
    targetType: AuditTargetType.ADMIN_INVITE,
    targetId: invite.id,
    metadata: {
      email,
      expiresAt: expiresAt.toISOString(),
    },
  });

  return ok({ invite }, 201);
}
