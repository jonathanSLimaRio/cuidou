export type InvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELED";

export const INVITATION_DEFAULT_EXPIRY_DAYS = 7;

export const invitationStatusLabel: Record<InvitationStatus, string> = {
  PENDING: "Pendente",
  ACCEPTED: "Aceito",
  DECLINED: "Recusado",
  EXPIRED: "Expirado",
  CANCELED: "Cancelado",
};

export function invitationStatusTone(status: InvitationStatus) {
  if (status === "PENDING") {
    return "warning" as const;
  }

  if (status === "ACCEPTED") {
    return "success" as const;
  }

  if (status === "DECLINED") {
    return "danger" as const;
  }

  if (status === "EXPIRED") {
    return "neutral" as const;
  }

  return "info" as const;
}

export function buildInvitationExpiry(days?: number) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (days ?? INVITATION_DEFAULT_EXPIRY_DAYS));
  return expiresAt;
}
