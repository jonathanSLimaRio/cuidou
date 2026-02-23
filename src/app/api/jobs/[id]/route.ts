import { auth } from "@/auth";
import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { buildScheduleSummary } from "@/lib/job-schedule";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { updateJobSchema } from "@/lib/schemas";
import { JobStatus, UserRole } from "@prisma/client";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;

  const session = await auth();
  const user = session?.user;

  const job = await prisma.jobPost.findUnique({
    where: { id },
    include: {
      family: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
      scheduleSlots: {
        orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!job) {
    return fail(404, "Job not found");
  }

  const canAccessPrivate =
    user &&
    (user.role === UserRole.ADMIN ||
      (user.role === UserRole.FAMILY && user.id === job.familyId));

  if (!job.isVisible && !canAccessPrivate) {
    return fail(404, "Job not found");
  }

  return ok({
    job: {
      ...job,
      scheduleSummary: buildScheduleSummary(job.scheduleSlots),
    },
  });
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;

  const authResult = await requireUser([UserRole.FAMILY, UserRole.ADMIN]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, updateJobSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const existing = await prisma.jobPost.findUnique({
    where: { id },
    select: { familyId: true },
  });

  if (!existing) {
    return fail(404, "Job not found");
  }

  if (
    authResult.user.role === UserRole.FAMILY &&
    existing.familyId !== authResult.user.id
  ) {
    return fail(403, "You can only update your own jobs");
  }

  const nextStatus = bodyResult.data.status;
  const hasScheduleUpdate = Array.isArray(bodyResult.data.scheduleSlots);

  const currentSlotCount = await prisma.jobScheduleSlot.count({
    where: { jobId: id },
  });

  const nextSlotCount = hasScheduleUpdate ? bodyResult.data.scheduleSlots!.length : currentSlotCount;

  if (nextStatus === JobStatus.OPEN && nextSlotCount === 0) {
    return fail(422, "To publish or reopen a job, provide at least one schedule slot.");
  }

  const { scheduleSlots, ...jobData } = bodyResult.data;

  const job = await prisma.$transaction(async (tx) => {
    const updated = await tx.jobPost.update({
      where: { id },
      data: jobData,
    });

    if (hasScheduleUpdate) {
      await tx.jobScheduleSlot.deleteMany({
        where: { jobId: id },
      });

      if (scheduleSlots && scheduleSlots.length > 0) {
        await tx.jobScheduleSlot.createMany({
          data: scheduleSlots.map((slot) => ({
            jobId: id,
            weekday: slot.weekday,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        });
      }
    }

    const updatedSlots = await tx.jobScheduleSlot.findMany({
      where: { jobId: id },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });

    return {
      ...updated,
      scheduleSlots: updatedSlots,
    };
  });

  return ok({
    job: {
      ...job,
      scheduleSummary: buildScheduleSummary(job.scheduleSlots),
    },
  });
}
