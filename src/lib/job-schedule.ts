import { Shift, Weekday } from "@/lib/prisma-enums";

export const WEEKDAY_ORDER: Weekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  MONDAY: "Segunda",
  TUESDAY: "Terça",
  WEDNESDAY: "Quarta",
  THURSDAY: "Quinta",
  FRIDAY: "Sexta",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

export const SHIFT_LABEL: Record<Shift, string> = {
  MORNING: "Manhã",
  AFTERNOON: "Tarde",
  EVENING: "Noite",
  OVERNIGHT: "Madrugada",
};

export type JobScheduleSlotInput = {
  weekday: Weekday;
  startTime: string;
  endTime: string;
};

export type ProfessionalShiftAvailability = {
  weekday: Weekday;
  shift: Shift;
  isAvailable: boolean;
};

export type ScheduleMatchWarning = {
  type: "PARTIAL_CONFLICT" | "TOTAL_CONFLICT" | "NO_PROFESSIONAL_AVAILABILITY";
  matchedSlots: number;
  totalSlots: number;
  message: string;
};

export type ScheduleMatchLevel = "HIGH" | "PARTIAL" | "LOW" | "UNKNOWN";

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function shiftToRange(shift: Shift) {
  if (shift === "MORNING") {
    return { start: 6 * 60, end: 12 * 60 };
  }

  if (shift === "AFTERNOON") {
    return { start: 12 * 60, end: 18 * 60 };
  }

  if (shift === "EVENING") {
    return { start: 18 * 60, end: 24 * 60 };
  }

  return { start: 0, end: 6 * 60 };
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

export function scheduleSlotToShifts(slot: JobScheduleSlotInput): Shift[] {
  const start = timeToMinutes(slot.startTime);
  const end = timeToMinutes(slot.endTime);

  return ["MORNING", "AFTERNOON", "EVENING", "OVERNIGHT"].filter((shift) => {
    const range = shiftToRange(shift as Shift);
    return rangesOverlap(start, end, range.start, range.end);
  }) as Shift[];
}

export function buildScheduleSummary(slots: JobScheduleSlotInput[]) {
  const grouped = WEEKDAY_ORDER.map((weekday) => {
    const entries = slots
      .filter((slot) => slot.weekday === weekday)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    return {
      weekday,
      label: WEEKDAY_LABEL[weekday],
      ranges: entries.map((entry) => `${entry.startTime} - ${entry.endTime}`),
    };
  }).filter((row) => row.ranges.length > 0);

  return grouped;
}

export function getScheduleMatchWarning(
  slots: JobScheduleSlotInput[],
  availability: ProfessionalShiftAvailability[],
): ScheduleMatchWarning | null {
  if (slots.length === 0) {
    return null;
  }

  const availableSet = new Set(
    availability
      .filter((entry) => entry.isAvailable)
      .map((entry) => `${entry.weekday}:${entry.shift}`),
  );

  if (availableSet.size === 0) {
    return {
      type: "NO_PROFESSIONAL_AVAILABILITY",
      matchedSlots: 0,
      totalSlots: slots.length,
      message:
        "O profissional ainda não cadastrou disponibilidade por turnos. A candidatura segue liberada.",
    };
  }

  let matchedSlots = 0;

  for (const slot of slots) {
    const shifts = scheduleSlotToShifts(slot);
    const hasMatch = shifts.some((shift) => availableSet.has(`${slot.weekday}:${shift}`));
    if (hasMatch) {
      matchedSlots += 1;
    }
  }

  if (matchedSlots === slots.length) {
    return null;
  }

  if (matchedSlots === 0) {
    return {
      type: "TOTAL_CONFLICT",
      matchedSlots,
      totalSlots: slots.length,
      message:
        "Não encontramos compatibilidade entre os horários da vaga e a disponibilidade do profissional. Você ainda pode prosseguir.",
    };
  }

  return {
    type: "PARTIAL_CONFLICT",
    matchedSlots,
    totalSlots: slots.length,
    message: `Compatibilidade parcial de agenda (${matchedSlots}/${slots.length} horários). Você ainda pode prosseguir.`,
  };
}

export function getScheduleMatchLevel(
  slots: JobScheduleSlotInput[],
  availability: ProfessionalShiftAvailability[],
) {
  const warning = getScheduleMatchWarning(slots, availability);

  if (!warning) {
    return {
      level: "HIGH" as const,
      label: "Compatibilidade alta",
      description: "Os horários da vaga estão alinhados com a disponibilidade informada.",
      warning: null,
    };
  }

  if (warning.type === "PARTIAL_CONFLICT") {
    return {
      level: "PARTIAL" as const,
      label: "Compatibilidade parcial",
      description: warning.message,
      warning,
    };
  }

  if (warning.type === "TOTAL_CONFLICT") {
    return {
      level: "LOW" as const,
      label: "Compatibilidade baixa",
      description: warning.message,
      warning,
    };
  }

  return {
    level: "UNKNOWN" as const,
    label: "Compatibilidade indisponível",
    description: warning.message,
    warning,
  };
}
