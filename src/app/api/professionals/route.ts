import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { VerificationStatus, Weekday } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceType = searchParams.get("serviceType") ?? undefined;
  const state = searchParams.get("state") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const verifiedOnly = searchParams.get("verifiedOnly") !== "false";
  const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") ?? "20"), 1), 100);

  const where = {
    ...(serviceType
      ? { serviceTypes: { has: serviceType as "BABYSITTER" | "ELDER_CAREGIVER" } }
      : {}),
    state,
    city,
    ...(verifiedOnly ? { verificationStatus: VerificationStatus.VERIFIED } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.professionalProfile.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        availabilitySlots: {
          select: {
            weekday: true,
            shift: true,
            isAvailable: true,
          },
        },
        _count: {
          select: {
            availabilityExceptions: true,
          },
        },
      },
    }),
    prisma.professionalProfile.count({ where }),
  ]);

  const reviewAverages = await prisma.review.groupBy({
    by: ["revieweeId"],
    where: {
      revieweeId: {
        in: items.map((item) => item.userId),
      },
    },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });

  const reviewMap = new Map(
    reviewAverages.map((entry) => [
      entry.revieweeId,
      {
        averageRating: entry._avg.rating,
        totalReviews: entry._count.rating,
      },
    ]),
  );

  return ok({
    items: items.map((item) => {
      const availableShiftsByWeekday: Record<Weekday, string[]> = {
        MONDAY: [],
        TUESDAY: [],
        WEDNESDAY: [],
        THURSDAY: [],
        FRIDAY: [],
        SATURDAY: [],
        SUNDAY: [],
      };

      for (const slot of item.availabilitySlots) {
        if (slot.isAvailable) {
          availableShiftsByWeekday[slot.weekday].push(slot.shift);
        }
      }

      return {
        ...item,
        reputation: reviewMap.get(item.userId) ?? {
          averageRating: null,
          totalReviews: 0,
        },
        availabilitySummary: {
          availableShiftsByWeekday,
          hasExceptions: item._count.availabilityExceptions > 0,
        },
      };
    }),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}
