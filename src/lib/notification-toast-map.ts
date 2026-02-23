export type NotificationFeedType =
  | "APPLICATION_RECEIVED"
  | "APPLICATION_STATUS_UPDATED"
  | "INVITATION_RECEIVED"
  | "INVITATION_STATUS_UPDATED"
  | "CHAT_MESSAGE"
  | "CONTRACT_STATUS_UPDATED"
  | "DOCUMENT_STATUS_UPDATED"
  | "REPORT_STATUS_UPDATED"
  | "SYSTEM";

export type NotificationFeedItem = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
};

export type NotificationToastTone = "success" | "error" | "warning" | "info" | "neutral";

const toneByType: Record<NotificationFeedType, NotificationToastTone> = {
  APPLICATION_RECEIVED: "info",
  APPLICATION_STATUS_UPDATED: "success",
  INVITATION_RECEIVED: "info",
  INVITATION_STATUS_UPDATED: "success",
  CHAT_MESSAGE: "info",
  CONTRACT_STATUS_UPDATED: "success",
  DOCUMENT_STATUS_UPDATED: "warning",
  REPORT_STATUS_UPDATED: "warning",
  SYSTEM: "neutral",
};

export function getNotificationToastTone(type: string): NotificationToastTone {
  return toneByType[type as NotificationFeedType] ?? "neutral";
}

export function mapNotificationToToast(item: NotificationFeedItem) {
  return {
    id: `notification-${item.id}`,
    tone: getNotificationToastTone(item.type),
    title: item.title,
    description: item.body ?? undefined,
  };
}
