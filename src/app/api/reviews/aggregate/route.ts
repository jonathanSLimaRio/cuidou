import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const revieweeId = searchParams.get("revieweeId");

  if (!revieweeId) {
    return fail(400, "revieweeId is required");
  }

  const [agg, distribution] = await Promise.all([
    prisma.review.aggregate({
      where: { revieweeId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { revieweeId },
      _count: { _all: true },
    }),
  ]);

  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const { rating, _count } of distribution) {
    dist[rating] = _count._all;
  }

  return ok({
    average: agg._avg.rating !== null ? Math.round(agg._avg.rating * 10) / 10 : null,
    count: agg._count.rating,
    distribution: dist,
  });
}
