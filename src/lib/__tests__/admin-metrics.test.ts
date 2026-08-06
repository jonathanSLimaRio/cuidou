import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  contract: { findMany: vi.fn(), groupBy: vi.fn(), count: vi.fn() },
  jobApplication: { findMany: vi.fn(), count: vi.fn() },
  report: { groupBy: vi.fn() },
  user: { count: vi.fn() },
  familyProfile: { count: vi.fn() },
  professionalProfile: { count: vi.fn() },
  jobPost: { count: vi.fn() },
  productEvent: { groupBy: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { getAdminMetrics } from "../admin-metrics";

describe("admin metrics", () => {
  beforeEach(() => {
    const createdAt = new Date("2026-08-05T10:00:00Z");
    prismaMock.contract.findMany.mockResolvedValue([
      { startedAt: new Date("2026-08-05T22:00:00Z"), job: { createdAt } },
    ]);
    prismaMock.jobApplication.findMany.mockResolvedValue([
      { createdAt, acceptedAt: new Date("2026-08-05T12:00:00Z"), rejectedAt: null },
      { createdAt, acceptedAt: null, rejectedAt: null },
    ]);
    prismaMock.report.groupBy.mockResolvedValue([{ targetType: "USER", _count: { targetType: 2 } }]);
    prismaMock.contract.groupBy.mockResolvedValue([{ status: "ACTIVE", _count: { status: 1 } }]);
    prismaMock.user.count.mockResolvedValue(3);
    prismaMock.familyProfile.count.mockResolvedValue(1);
    prismaMock.professionalProfile.count.mockResolvedValue(2);
    prismaMock.jobPost.count.mockResolvedValue(4);
    prismaMock.jobApplication.count.mockResolvedValue(1);
    prismaMock.contract.count.mockResolvedValue(1);
    prismaMock.productEvent.groupBy.mockResolvedValue([{ name: "signup", _count: { name: 3 } }]);
  });

  it("calculates the operational funnel and response timings", async () => {
    const result = await getAdminMetrics(30);
    expect(result.averageTimeToHireHours).toBe(12);
    expect(result.responseRate24h).toBe(50);
    expect(result.funnel).toMatchObject({ activeRegistrations: 3, completeProfiles: 3, applications: 2 });
    expect(result.applicationsTrendDaily).toEqual([{ date: "2026-08-05", count: 2 }]);
    expect(result.commercialEvents).toEqual({ signup: 3 });
  });

  it("returns safe zeroes when the window has no events", async () => {
    prismaMock.contract.findMany.mockResolvedValue([]);
    prismaMock.jobApplication.findMany.mockResolvedValue([]);
    expect(await getAdminMetrics(7)).toMatchObject({ averageTimeToHireHours: null, responseRate24h: 0 });
  });
});
