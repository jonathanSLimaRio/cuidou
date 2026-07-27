import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parsePagination } from "@/lib/request";
import { ServiceType, UserStatus, VerificationStatus, Weekday } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceTypeParam = searchParams.get("serviceType") ?? undefined;
  const state = searchParams.get("state") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  if (serviceTypeParam && !Object.values(ServiceType).includes(serviceTypeParam as ServiceType)) {
    return fail(422, "Invalid serviceType filter");
  }
  const serviceType = serviceTypeParam as ServiceType | undefined;
  const { page, pageSize } = parsePagination(searchParams, { defaultPageSize: 20, maxPageSize: 100 });

  const where = {
    ...(serviceType
      ? { serviceTypes: { has: serviceType } }
      : {}),
    state,
    city,
    // Public marketplace must never expose unverified professional profiles.
    verificationStatus: VerificationStatus.VERIFIED,
    user: { status: UserStatus.ACTIVE },
  };

  const [items, total] = await Promise.all([
    prisma.professionalProfile.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
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
