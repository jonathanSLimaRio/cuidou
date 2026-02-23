import { auth } from "@/auth";
import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { createJobSchema } from "@/lib/schemas";
import { JobStatus, UserRole } from "@prisma/client";

export async function POST(request: Request) {
  const authResult = await requireUser([UserRole.FAMILY]);
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

  const job = await prisma.jobPost.create({
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

  return ok({ job }, 201);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceType = searchParams.get("serviceType") ?? undefined;
  const state = searchParams.get("state") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const mine = searchParams.get("mine") === "true";
  const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") ?? "20"), 1), 100);

  let familyId: string | undefined;
  if (mine) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== UserRole.FAMILY) {
      return fail(401, "Only authenticated families can use mine=true");
    }

    familyId = session.user.id;
  }

  const where = {
    serviceType: serviceType as "BABYSITTER" | "ELDER_CAREGIVER" | undefined,
    state,
    city,
    status: status as JobStatus | undefined,
    familyId,
    ...(mine ? {} : { isVisible: true, status: JobStatus.OPEN }),
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
      },
    }),
    prisma.jobPost.count({ where }),
  ]);

  return ok({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}
