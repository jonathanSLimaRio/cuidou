export type MobileNotificationType =
  | "APPLICATION_RECEIVED"
  | "APPLICATION_STATUS_UPDATED"
  | "INVITATION_RECEIVED"
  | "INVITATION_STATUS_UPDATED"
  | "CHAT_MESSAGE"
  | "CONTRACT_STATUS_UPDATED"
  | "DOCUMENT_STATUS_UPDATED"
  | "REPORT_STATUS_UPDATED"
  | "SYSTEM";

export type NotificationPayload = {
  notificationType?: MobileNotificationType | string;
  conversationId?: string;
  applicationId?: string;
  invitationId?: string;
  contractId?: string;
  documentId?: string;
  jobId?: string;
};

export type NotificationRoutingRole = "FAMILY" | "PROFESSIONAL" | "ADMIN" | null;

export function normalizeNotificationPayload(raw: unknown): NotificationPayload {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const data = raw as Record<string, unknown>;

  return {
    notificationType:
      typeof data.notificationType === "string" ? data.notificationType : undefined,
    conversationId: typeof data.conversationId === "string" ? data.conversationId : undefined,
    applicationId: typeof data.applicationId === "string" ? data.applicationId : undefined,
    invitationId: typeof data.invitationId === "string" ? data.invitationId : undefined,
    contractId: typeof data.contractId === "string" ? data.contractId : undefined,
    documentId: typeof data.documentId === "string" ? data.documentId : undefined,
    jobId: typeof data.jobId === "string" ? data.jobId : undefined,
  };
}

export function resolveNotificationNavigationTarget(
  payload: NotificationPayload,
  role: NotificationRoutingRole | undefined,
): string | null {
  const { notificationType, conversationId } = payload;

  switch (notificationType) {
    case "CHAT_MESSAGE":
      return conversationId ? `/(protected)/chat/${conversationId}` : null;

    case "APPLICATION_RECEIVED":
      return role === "FAMILY" ? "/(family)/pipeline" : null;

    case "APPLICATION_STATUS_UPDATED":
      if (role === "PROFESSIONAL") {
        return "/(professional)/applications";
      }
      if (role === "FAMILY") {
        return "/(family)/pipeline";
      }
      return null;

    case "INVITATION_RECEIVED":
    case "INVITATION_STATUS_UPDATED":
      if (role === "FAMILY") {
        return "/(family)/invitations";
      }
      if (role === "PROFESSIONAL") {
        return "/(professional)/invitations";
      }
      return null;

    case "CONTRACT_STATUS_UPDATED":
      if (role === "PROFESSIONAL") {
        return "/(professional)/contracts";
      }
      if (role === "FAMILY") {
        return "/(family)/contracts";
      }
      return null;

    case "DOCUMENT_STATUS_UPDATED":
      return role === "PROFESSIONAL" ? "/(professional)/documents" : null;

    case "REPORT_STATUS_UPDATED":
    case "SYSTEM":
      return "/(protected)/notifications";

    default:
      return null;
  }
}
