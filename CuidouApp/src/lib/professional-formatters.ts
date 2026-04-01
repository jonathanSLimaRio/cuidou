import type {
  ApplicationStatus,
  DocumentType,
  JobInvitationStatus,
  VerificationStatus,
} from "@/src/lib/types/professional";
import type { Shift, Weekday } from "@/src/lib/types/marketplace";

export function weekdayLabel(value: Weekday) {
  const labels: Record<Weekday, string> = {
    MONDAY: "Segunda",
    TUESDAY: "Terça",
    WEDNESDAY: "Quarta",
    THURSDAY: "Quinta",
    FRIDAY: "Sexta",
    SATURDAY: "Sábado",
    SUNDAY: "Domingo",
  };

  return labels[value];
}

export function shiftLabel(value: Shift) {
  const labels: Record<Shift, string> = {
    MORNING: "Manhã",
    AFTERNOON: "Tarde",
    EVENING: "Noite",
    OVERNIGHT: "Madrugada",
  };
  return labels[value];
}

export function documentTypeLabel(value: DocumentType) {
  const labels: Record<DocumentType, string> = {
    IDENTITY: "Documento de identidade",
    BACKGROUND_CHECK: "Antecedentes",
    CERTIFICATION: "Certificação",
    OTHER: "Outro",
  };
  return labels[value];
}

export function verificationStatusLabel(value: VerificationStatus) {
  if (value === "UNDER_REVIEW") {
    return "Em revisão";
  }
  if (value === "VERIFIED") {
    return "Verificado";
  }
  if (value === "REJECTED") {
    return "Rejeitado";
  }
  return "Não enviado";
}

export function invitationStatusLabel(value: JobInvitationStatus) {
  const labels: Record<JobInvitationStatus, string> = {
    PENDING: "Pendente",
    ACCEPTED: "Aceito",
    DECLINED: "Recusado",
    EXPIRED: "Expirado",
    CANCELED: "Cancelado",
  };
  return labels[value];
}

export function applicationStatusLabel(value: ApplicationStatus) {
  const labels: Record<ApplicationStatus, string> = {
    SUBMITTED: "Enviada",
    SHORTLISTED: "Pré-selecionada",
    ACCEPTED: "Aceita",
    REJECTED: "Recusada",
    WITHDRAWN: "Retirada",
  };
  return labels[value];
}
