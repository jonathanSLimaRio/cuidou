import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { buildScheduleSummary } from "@/lib/job-schedule";
import { prisma } from "@/lib/prisma";
import { parseJsonBody, parsePagination } from "@/lib/request";
import { ProductEventName, trackProductEvent } from "@/lib/product-events";
import { createJobSchema } from "@/lib/schemas";
import { JobStatus, ServiceType, UserRole, UserStatus } from "@prisma/client";

export async function POST(request: Request) {
  const authResult = await requireUser([UserRole.FAMILY], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, createJobSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const data = bodyResult.data;

  const familyProfile = await prisma.familyProfile.findUnique({
    where: { userId: authResult.user.id },
    select: { id: true },
  });

  if (!familyProfile) {
    return fail(400, "Family profile must be created before posting jobs");
  }

  const job = await prisma.$transaction(async (tx) => {
    const created = await tx.jobPost.create({
      data: {
        familyId: authResult.user.id,
        serviceType: data.serviceType,
        title: data.title,
        description: data.description,
        state: data.state,
        city: data.city,
        neighborhood: data.neighborhood,
        hourlyRateMin: data.hourlyRateMin,
        hourlyRateMax: data.hourlyRateMax,
        scheduleDetails: data.scheduleDetails,
        status: JobStatus.OPEN,
      },
    });

    await tx.jobScheduleSlot.createMany({
      data: data.scheduleSlots.map((slot) => ({
        jobId: created.id,
        weekday: slot.weekday,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    });

    return tx.jobPost.findUniqueOrThrow({
      where: { id: created.id },
      include: {
        scheduleSlots: {
          orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
        },
      },
    });
  });

  trackProductEvent({
    name: ProductEventName.JOB_PUBLISHED,
    userId: authResult.user.id,
    metadata: { jobId: job.id, serviceType: job.serviceType, city: job.city, state: job.state },
  });

  return ok(
    {
      job: {
        ...job,
        scheduleSummary: buildScheduleSummary(job.scheduleSlots),
      },
    },
    201,
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceTypeParam = searchParams.get("serviceType") ?? undefined;
  const state = searchParams.get("state") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const statusParam = searchParams.get("status") ?? undefined;
  if (serviceTypeParam && !Object.values(ServiceType).includes(serviceTypeParam as ServiceType)) {
    return fail(422, "Invalid serviceType filter");
  }
  if (statusParam && !Object.values(JobStatus).includes(statusParam as JobStatus)) {
    return fail(422, "Invalid status filter");
  }
  const serviceType = serviceTypeParam as ServiceType | undefined;
  const status = statusParam as JobStatus | undefined;
  const mine = searchParams.get("mine") === "true";
  const { page, pageSize } = parsePagination(searchParams, { defaultPageSize: 20, maxPageSize: 100 });

  let familyId: string | undefined;
  if (mine) {
    const authResult = await requireUser([UserRole.FAMILY], request);
    if ("response" in authResult) {
      return authResult.response;
    }

    familyId = authResult.user.id;
  }

  const where = {
    serviceType: serviceType as "BABYSITTER" | "ELDER_CAREGIVER" | undefined,
    state,
    city,
    status: status as JobStatus | undefined,
    familyId,
    ...(mine
      ? {}
      : { isVisible: true, status: JobStatus.OPEN, family: { status: UserStatus.ACTIVE } }),
  };

  const [items, total] = await Promise.all([
    prisma.jobPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        family: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
        scheduleSlots: {
          select: {
            weekday: true,
            startTime: true,
            endTime: true,
          },
          orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
        },
      },
    }),
    prisma.jobPost.count({ where }),
  ]);

  return ok({
    items: items.map((item) => ({
      ...item,
      scheduleSummary: buildScheduleSummary(item.scheduleSlots),
    })),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}
