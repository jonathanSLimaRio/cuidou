import { describe, expect, it } from "vitest";
import {
  buildScheduleSummary,
  getScheduleMatchLevel,
  getScheduleMatchWarning,
  scheduleSlotToShifts,
  timeToMinutes,
} from "../job-schedule";

const slots = [
  { weekday: "MONDAY" as const, startTime: "08:00", endTime: "12:00" },
  { weekday: "MONDAY" as const, startTime: "18:00", endTime: "22:00" },
];

describe("job schedule matching", () => {
  it("converts and groups ranges in chronological order", () => {
    expect(timeToMinutes("08:30")).toBe(510);
    expect(scheduleSlotToShifts(slots[0])).toEqual(["MORNING"]);
    expect(scheduleSlotToShifts({ ...slots[0], startTime: "11:00", endTime: "13:00" })).toEqual([
      "MORNING",
      "AFTERNOON",
    ]);
    expect(buildScheduleSummary([...slots].reverse())[0].ranges).toEqual([
      "08:00 - 12:00",
      "18:00 - 22:00",
    ]);
  });

  it("covers high, partial, low and unknown compatibility", () => {
    expect(getScheduleMatchWarning([], [])).toBeNull();
    expect(getScheduleMatchLevel(slots, [])).toMatchObject({ level: "UNKNOWN" });
    expect(
      getScheduleMatchLevel(slots, [
        { weekday: "MONDAY", shift: "MORNING", isAvailable: true },
      ]),
    ).toMatchObject({ level: "PARTIAL" });
    expect(
      getScheduleMatchLevel(slots, [
        { weekday: "TUESDAY", shift: "MORNING", isAvailable: true },
      ]),
    ).toMatchObject({ level: "LOW" });
    expect(
      getScheduleMatchLevel(slots, [
        { weekday: "MONDAY", shift: "MORNING", isAvailable: true },
        { weekday: "MONDAY", shift: "EVENING", isAvailable: true },
        { weekday: "MONDAY", shift: "AFTERNOON", isAvailable: false },
      ]),
    ).toMatchObject({ level: "HIGH", warning: null });
  });

  it("maps every shift boundary", () => {
    expect(scheduleSlotToShifts({ weekday: "SUNDAY", startTime: "00:00", endTime: "06:00" })).toEqual(["OVERNIGHT"]);
    expect(scheduleSlotToShifts({ weekday: "SUNDAY", startTime: "12:00", endTime: "18:00" })).toEqual(["AFTERNOON"]);
    expect(scheduleSlotToShifts({ weekday: "SUNDAY", startTime: "18:00", endTime: "23:59" })).toEqual(["EVENING"]);
  });
});
