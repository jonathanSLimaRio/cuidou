import { JobInvitationStatus } from "@/lib/prisma-enums";

export const invitationStatusLabel: Record<JobInvitationStatus, string> = {
  PENDING: "Pendente",
  ACCEPTED: "Aceito",
  DECLINED: "Recusado",
  EXPIRED: "Expirado",
  CANCELED: "Cancelado",
};

export function invitationStatusTone(status: JobInvitationStatus) {
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
