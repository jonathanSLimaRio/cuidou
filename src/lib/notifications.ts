import { prisma } from "@/lib/prisma";
import { NotificationType, Prisma } from "@prisma/client";

export async function notifyUser(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Prisma.InputJsonValue;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data,
    },
  });
}

export async function notifyMany(
  notifications: Array<{
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    data?: Prisma.InputJsonValue;
  }>,
) {
  if (notifications.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: notifications.map((n) => ({
      userId: n.userId,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data,
    })),
  });
}
