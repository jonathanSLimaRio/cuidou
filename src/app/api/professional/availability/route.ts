import { requireUser } from "@/lib/auth-guard";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { professionalAvailabilitySchema } from "@/lib/schemas";
import { UserRole } from "@prisma/client";

export async function GET() {
  const authResult = await requireUser([UserRole.PROFESSIONAL]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: authResult.user.id },
    select: {
      id: true,
      availability: true,
      availabilitySlots: {
        orderBy: [{ weekday: "asc" }, { shift: "asc" }],
      },
      availabilityExceptions: {
        orderBy: [{ date: "asc" }, { shift: "asc" }],
      },
    },
  });

  if (!profile) {
    return fail(404, "Professional profile not found");
  }

  return ok({
    weeklySlots: profile.availabilitySlots,
    exceptions: profile.availabilityExceptions.map((item) => ({
      ...item,
      date: item.date.toISOString().slice(0, 10),
    })),
    legacyAvailabilityText: profile.availability,
  });
}

export async function PUT(request: Request) {
  const authResult = await requireUser([UserRole.PROFESSIONAL]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, professionalAvailabilitySchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: authResult.user.id },
    select: { id: true },
  });

  if (!profile) {
    return fail(404, "Professional profile not found");
  }

  const { weeklySlots, exceptions } = bodyResult.data;

  await prisma.$transaction(async (tx) => {
    await tx.professionalAvailabilitySlot.deleteMany({
      where: {
        professionalProfileId: profile.id,
      },
    });

    if (weeklySlots.length > 0) {
      await tx.professionalAvailabilitySlot.createMany({
        data: weeklySlots.map((item) => ({
          professionalProfileId: profile.id,
          weekday: item.weekday,
          shift: item.shift,
          isAvailable: item.isAvailable,
        })),
      });
    }

    await tx.professionalAvailabilityException.deleteMany({
      where: {
        professionalProfileId: profile.id,
      },
    });

    if (exceptions.length > 0) {
      await tx.professionalAvailabilityException.createMany({
        data: exceptions.map((item) => ({
          professionalProfileId: profile.id,
          date: new Date(`${item.date}T00:00:00.000Z`),
          shift: item.shift,
          isAvailable: item.isAvailable,
          note: item.note,
        })),
      });
    }
  });

  const updated = await prisma.professionalProfile.findUnique({
    where: { id: profile.id },
    select: {
      availabilitySlots: {
        orderBy: [{ weekday: "asc" }, { shift: "asc" }],
      },
      availabilityExceptions: {
        orderBy: [{ date: "asc" }, { shift: "asc" }],
      },
      availability: true,
    },
  });

  return ok({
    weeklySlots: updated?.availabilitySlots ?? [],
    exceptions:
      updated?.availabilityExceptions.map((item) => ({
        ...item,
        date: item.date.toISOString().slice(0, 10),
      })) ?? [],
    legacyAvailabilityText: updated?.availability ?? null,
  });
}
