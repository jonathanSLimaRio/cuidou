import { prisma } from "@/lib/prisma";
import { sendExpoPushNotifications } from "@/lib/expo-push";
import { logger } from "@/lib/logger";
import { NotificationType, Prisma } from "@prisma/client";

export async function notifyUser(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Prisma.InputJsonValue;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data,
    },
  });

  // Fire-and-forget — push failures must not affect the caller
  void dispatchPushToUser(
    params.userId,
    params.title,
    params.body,
    params.data as Record<string, unknown> | undefined,
    params.type,
  );

  return notification;
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

  // Fire-and-forget per user
  for (const n of notifications) {
    void dispatchPushToUser(
      n.userId,
      n.title,
      n.body,
      n.data as Record<string, unknown> | undefined,
      n.type,
    );
  }
}

async function dispatchPushToUser(
  userId: string,
  title: string,
  body: string | undefined,
  data: Record<string, unknown> | undefined,
  notificationType: NotificationType,
): Promise<void> {
  try {
    const tokens = await prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (tokens.length === 0) return;

    await sendExpoPushNotifications(
      tokens.map((t) => ({
        to: t.token,
        title,
        body,
        data: { ...data, notificationType },
        sound: "default" as const,
        channelId: "default",
      })),
    );
  } catch (error) {
    logger.error("Failed to dispatch push notification", { userId, error });
  }
}
