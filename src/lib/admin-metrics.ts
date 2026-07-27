import { prisma } from "@/lib/prisma";
import { ContractStatus, ReportTargetType } from "@prisma/client";

export type MetricsWindow = 7 | 30 | 90;

export type AdminMetrics = {
  windowDays: MetricsWindow;
  since: string;
  averageTimeToHireHours: number | null;
  responseRate24h: number;
  reportsByTargetType: Record<ReportTargetType, number>;
  contractsByStatus: Record<ContractStatus, number>;
  applicationsTrendDaily: Array<{ date: string; count: number }>;
  funnel: {
    activeRegistrations: number;
    completeProfiles: number;
    publishedJobs: number;
    applications: number;
    acceptedApplications: number;
    contractsStarted: number;
    contractsCompleted: number;
  };
  commercialEvents: Record<string, number>;
};

function startDateFromWindow(windowDays: MetricsWindow) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - windowDays + 1);
  return since;
}

export async function getAdminMetrics(windowDays: MetricsWindow): Promise<AdminMetrics> {
  const since = startDateFromWindow(windowDays);

  const [contractsStarted, applications, reportsGrouped, contractsGrouped, activeRegistrations, completeFamilyProfiles, completeProfessionalProfiles, publishedJobs, acceptedApplications, contractsCompleted, commercialEventsGrouped] =
    await Promise.all([
      prisma.contract.findMany({
        where: {
          startedAt: {
            gte: since,
          },
        },
        select: {
          startedAt: true,
          job: {
            select: {
              createdAt: true,
            },
          },
        },
      }),
      prisma.jobApplication.findMany({
        where: {
          createdAt: {
            gte: since,
          },
        },
        select: {
          createdAt: true,
          acceptedAt: true,
          rejectedAt: true,
        },
      }),
      prisma.report.groupBy({
        by: ["targetType"],
        where: {
          createdAt: {
            gte: since,
          },
        },
        _count: {
          targetType: true,
        },
      }),
      prisma.contract.groupBy({
        by: ["status"],
        where: {
          createdAt: {
            gte: since,
          },
        },
        _count: {
          status: true,
        },
      }),
      prisma.user.count({ where: { status: "ACTIVE", createdAt: { gte: since } } }),
      prisma.familyProfile.count({ where: { updatedAt: { gte: since }, contactName: { not: null }, bio: { not: null }, state: { not: null }, city: { not: null } } }),
      prisma.professionalProfile.count({ where: { updatedAt: { gte: since }, bio: { not: null }, state: { not: null }, city: { not: null }, serviceTypes: { isEmpty: false } } }),
      prisma.jobPost.count({ where: { createdAt: { gte: since }, isVisible: true } }),
      prisma.jobApplication.count({ where: { acceptedAt: { gte: since } } }),
      prisma.contract.count({ where: { completedAt: { gte: since } } }),
      prisma.productEvent.groupBy({
        by: ["name"],
        where: { createdAt: { gte: since } },
        _count: { name: true },
      }),
    ]);

  const totalHireHours = contractsStarted.reduce((sum, contract) => {
    const diffMs = contract.startedAt.getTime() - contract.job.createdAt.getTime();
    return sum + diffMs / (1000 * 60 * 60);
  }, 0);

  const averageTimeToHireHours =
    contractsStarted.length > 0
      ? Number((totalHireHours / contractsStarted.length).toFixed(2))
      : null;

  const responsesWithin24h = applications.filter((application) => {
    const responseAt = application.acceptedAt ?? application.rejectedAt;
    if (!responseAt) {
      return false;
    }

    const diffMs = responseAt.getTime() - application.createdAt.getTime();
    return diffMs <= 24 * 60 * 60 * 1000;
  }).length;

  const responseRate24h =
    applications.length > 0
      ? Number(((responsesWithin24h / applications.length) * 100).toFixed(2))
      : 0;

  const reportsByTargetType = Object.values(ReportTargetType).reduce(
    (acc, targetType) => {
      acc[targetType] = 0;
      return acc;
    },
    {} as Record<ReportTargetType, number>,
  );

  for (const row of reportsGrouped) {
    reportsByTargetType[row.targetType] = row._count.targetType;
  }

  const contractsByStatus = Object.values(ContractStatus).reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<ContractStatus, number>,
  );

  for (const row of contractsGrouped) {
    contractsByStatus[row.status] = row._count.status;
  }

  const dailyMap = new Map<string, number>();
  for (const application of applications) {
    const key = application.createdAt.toISOString().slice(0, 10);
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
  }

  const applicationsTrendDaily = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const commercialEvents = Object.fromEntries(
    commercialEventsGrouped.map((row) => [row.name, row._count.name]),
  );

  return {
    windowDays,
    since: since.toISOString(),
    averageTimeToHireHours,
    responseRate24h,
    reportsByTargetType,
    contractsByStatus,
    applicationsTrendDaily,
    funnel: {
      activeRegistrations,
      completeProfiles: completeFamilyProfiles + completeProfessionalProfiles,
      publishedJobs,
      applications: applications.length,
      acceptedApplications,
      contractsStarted: contractsStarted.length,
      contractsCompleted,
    },
    commercialEvents,
  };
}
