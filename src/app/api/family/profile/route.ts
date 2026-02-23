import { requireUser } from "@/lib/auth-guard";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { familyProfileSchema } from "@/lib/schemas";
import { UserRole } from "@prisma/client";

export async function GET() {
  const authResult = await requireUser([UserRole.FAMILY]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const profile = await prisma.familyProfile.findUnique({
    where: { userId: authResult.user.id },
  });

  return ok({
    user: authResult.user,
    profile,
  });
}

export async function PUT(request: Request) {
  const authResult = await requireUser([UserRole.FAMILY]);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, familyProfileSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const data = bodyResult.data;

  const profile = await prisma.familyProfile.upsert({
    where: { userId: authResult.user.id },
    update: {
      contactName: data.contactName,
      bio: data.bio,
      state: data.state,
      city: data.city,
      neighborhood: data.neighborhood,
    },
    create: {
      userId: authResult.user.id,
      contactName: data.contactName,
      bio: data.bio,
      state: data.state,
      city: data.city,
      neighborhood: data.neighborhood,
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
