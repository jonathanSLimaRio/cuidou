import type { JobScheduleSlotInput } from "@/src/lib/types/family";
import type { Weekday } from "@/src/lib/types/marketplace";

export const weekdayOrder: Weekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export const defaultScheduleSlot: JobScheduleSlotInput = {
  weekday: "MONDAY",
  startTime: "08:00",
  endTime: "12:00",
};

const hhmmRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function hasInvalidSchedule(slots: JobScheduleSlotInput[]) {
  if (slots.length === 0) {
    return true;
  }

  const keys = new Set<string>();

  for (const slot of slots) {
    if (!hhmmRegex.test(slot.startTime) || !hhmmRegex.test(slot.endTime)) {
      return true;
    }

    if (timeToMinutes(slot.endTime) <= timeToMinutes(slot.startTime)) {
      return true;
    }

    const key = `${slot.weekday}:${slot.startTime}:${slot.endTime}`;
    if (keys.has(key)) {
      return true;
    }
    keys.add(key);
  }

  return false;
}

