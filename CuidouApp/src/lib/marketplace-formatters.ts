import type { ServiceType, Shift, VerificationStatus, Weekday } from "@/src/lib/types/marketplace";

export function serviceTypeLabel(value: ServiceType) {
  return value === "BABYSITTER" ? "Babá" : "Cuidador(a) de idosos";
}

export function verificationLabel(value: VerificationStatus) {
  if (value === "VERIFIED") {
    return "Verificado";
  }

  if (value === "UNDER_REVIEW") {
    return "Em revisão";
  }

  if (value === "REJECTED") {
    return "Rejeitado";
  }

  return "Não enviado";
}

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

export function moneyRange(min?: number | null, max?: number | null) {
  if (!min && !max) {
    return "Faixa não informada";
  }

  if (min && max) {
    return `R$ ${min} - R$ ${max}`;
  }

  if (min) {
    return `A partir de R$ ${min}`;
  }

  return `Até R$ ${max}`;
}
