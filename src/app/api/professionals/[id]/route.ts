import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { UserStatus, VerificationStatus } from "@prisma/client";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;

  const professional = await prisma.professionalProfile.findUnique({
    where: { id, user: { status: UserStatus.ACTIVE } },
    select: {
      id: true,
      userId: true,
      bio: true,
      experienceYears: true,
      serviceTypes: true,
      availability: true,
      state: true,
      city: true,
      neighborhood: true,
      hourlyRateMin: true,
      hourlyRateMax: true,
      verificationStatus: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      availabilitySlots: {
        where: { isAvailable: true },
        orderBy: [{ weekday: "asc" }, { shift: "asc" }],
        select: { weekday: true, shift: true, isAvailable: true },
      },
      availabilityExceptions: {
        orderBy: [{ date: "asc" }, { shift: "asc" }],
        take: 10,
        select: { date: true, shift: true, isAvailable: true },
      },
    },
  });

  if (!professional) {
    return fail(404, "Professional not found");
  }

  if (professional.verificationStatus !== VerificationStatus.VERIFIED) {
    return fail(404, "Professional not found");
  }

  const reputation = await prisma.review.aggregate({
    where: {
      revieweeId: professional.userId,
    },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });

  return ok({
    professional: {
      ...professional,
      reputation: {
        averageRating: reputation._avg.rating,
        totalReviews: reputation._count.rating,
      },
    },
  });
}
