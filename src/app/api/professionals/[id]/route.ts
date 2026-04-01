import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;

  const professional = await prisma.professionalProfile.findUnique({
    where: { id },
    include: {
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
      },
      availabilityExceptions: {
        orderBy: [{ date: "asc" }, { shift: "asc" }],
        take: 10,
      },
    },
  });

  if (!professional) {
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
