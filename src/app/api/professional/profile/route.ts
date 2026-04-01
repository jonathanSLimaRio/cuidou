import { requireUser } from "@/lib/auth-guard";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { professionalProfileSchema } from "@/lib/schemas";
import { UserRole } from "@prisma/client";

export async function GET(request: Request) {
  const authResult = await requireUser([UserRole.PROFESSIONAL], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: authResult.user.id },
    include: {
      documents: true,
    },
  });

  return ok({
    user: authResult.user,
    profile,
  });
}

export async function PUT(request: Request) {
  const authResult = await requireUser([UserRole.PROFESSIONAL], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, professionalProfileSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const data = bodyResult.data;

  const profile = await prisma.professionalProfile.upsert({
    where: { userId: authResult.user.id },
    update: {
      bio: data.bio,
      experienceYears: data.experienceYears,
      serviceTypes: data.serviceTypes,
      availability: data.availability,
      state: data.state,
      city: data.city,
      neighborhood: data.neighborhood,
      hourlyRateMin: data.hourlyRateMin,
      hourlyRateMax: data.hourlyRateMax,
    },
    create: {
      userId: authResult.user.id,
      bio: data.bio,
      experienceYears: data.experienceYears,
      serviceTypes: data.serviceTypes,
      availability: data.availability,
      state: data.state,
      city: data.city,
      neighborhood: data.neighborhood,
      hourlyRateMin: data.hourlyRateMin,
      hourlyRateMax: data.hourlyRateMax,
    },
  });

  if (data.phone) {
    await prisma.user.update({
      where: { id: authResult.user.id },
      data: { phone: data.phone },
    });
  }

  return ok({ profile });
}
