import { JobInvitationStatus, NotificationType, Prisma, PrismaClient } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import {
  buildInvitationExpiry,
  INVITATION_DEFAULT_EXPIRY_DAYS,
  invitationStatusLabel,
  invitationStatusTone,
} from "@/lib/invitation-core";
import { notifyMany } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type InvitationDb = PrismaClient | Prisma.TransactionClient;

export {
  buildInvitationExpiry,
  INVITATION_DEFAULT_EXPIRY_DAYS,
  invitationStatusLabel,
  invitationStatusTone,
};

export async function expirePendingInvitations(db: InvitationDb, extraWhere?: Prisma.JobInvitationWhereInput) {
  return db.jobInvitation.updateMany({
    where: {
      status: JobInvitationStatus.PENDING,
      expiresAt: {
        lt: new Date(),
      },
      ...extraWhere,
    },
    data: {
      status: JobInvitationStatus.EXPIRED,
      respondedAt: new Date(),
    },
  });
}

export async function expirePendingInvitationsWithNotifications(
  extraWhere?: Prisma.JobInvitationWhereInput,
) {
  const expiring = await prisma.jobInvitation.findMany({
    where: {
      status: JobInvitationStatus.PENDING,
      expiresAt: {
        lt: new Date(),
      },
      ...extraWhere,
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
        },
      },
      family: {
        select: {
          id: true,
          email: true,
        },
      },
      professional: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (expiring.length === 0) {
    return [];
  }

  const invitationIds = expiring.map((item) => item.id);
  const now = new Date();

  await prisma.jobInvitation.updateMany({
    where: {
      id: {
        in: invitationIds,
      },
    },
    data: {
      status: JobInvitationStatus.EXPIRED,
      respondedAt: now,
    },
  });

  await notifyMany(
    expiring.flatMap((item) => [
      {
        userId: item.familyId,
        type: NotificationType.INVITATION_STATUS_UPDATED,
        title: "Convite expirado",
        body: `O convite para a vaga \"${item.job.title}\" expirou sem resposta.`,
        data: {
          invitationId: item.id,
          status: JobInvitationStatus.EXPIRED,
          jobId: item.job.id,
        },
      },
      {
        userId: item.professionalId,
        type: NotificationType.INVITATION_STATUS_UPDATED,
        title: "Convite expirado",
        body: `O convite para a vaga \"${item.job.title}\" foi marcado como expirado.`,
        data: {
          invitationId: item.id,
          status: JobInvitationStatus.EXPIRED,
          jobId: item.job.id,
        },
      },
    ]),
  );

  await Promise.all(
    expiring.flatMap((item) => {
      const tasks: Promise<void>[] = [];

      if (item.family.email) {
        tasks.push(
          sendEmail({
            to: item.family.email,
            subject: "Convite expirado na Cuidou",
            html: `<p>O convite para a vaga <strong>${item.job.title}</strong> expirou sem resposta.</p>`,
          }),
        );
      }

      if (item.professional.email) {
        tasks.push(
          sendEmail({
            to: item.professional.email,
            subject: "Convite expirado na Cuidou",
            html: `<p>O convite para a vaga <strong>${item.job.title}</strong> foi marcado como expirado.</p>`,
          }),
        );
      }

      return tasks;
    }),
  );

  return invitationIds;
}
