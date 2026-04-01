import type {
  ApplicationStatus,
  ContractStatus,
  JobInvitationStatus,
} from "@/src/lib/types/family";

export function applicationStatusLabel(status: ApplicationStatus) {
  if (status === "SUBMITTED") {
    return "Enviada";
  }
  if (status === "SHORTLISTED") {
    return "Pre-selecionada";
  }
  if (status === "ACCEPTED") {
    return "Aceita";
  }
  if (status === "REJECTED") {
    return "Recusada";
  }
  return "Retirada";
}

export function invitationStatusLabel(status: JobInvitationStatus) {
  if (status === "PENDING") {
    return "Pendente";
  }
  if (status === "ACCEPTED") {
    return "Aceito";
  }
  if (status === "DECLINED") {
    return "Recusado";
  }
  if (status === "EXPIRED") {
    return "Expirado";
  }
  return "Cancelado";
}

export function contractStatusLabel(status: ContractStatus) {
  if (status === "IN_PROGRESS") {
    return "Em andamento";
  }
  if (status === "COMPLETED") {
    return "Concluido";
  }
  return "Cancelado";
}

