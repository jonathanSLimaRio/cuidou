import { requireUser } from "@/lib/auth-guard";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const registerSchema = z.object({
  token: z.string().regex(/^ExponentPushToken\[[^\]]+\]$/, "Invalid Expo push token"),
  platform: z.enum(["ios", "android", "web"]),
});

const removeSchema = z.object({
  token: z.string().regex(/^ExponentPushToken\[[^\]]+\]$/, "Invalid Expo push token"),
});

export async function POST(request: Request) {
  const authResult = await requireUser([UserRole.FAMILY, UserRole.PROFESSIONAL, UserRole.ADMIN], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, registerSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const { token, platform } = bodyResult.data;

  await prisma.pushToken.upsert({
    where: { token },
    create: { userId: authResult.user.id, token, platform },
    update: { userId: authResult.user.id, platform },
  });

  return ok({ success: true });
}

export async function DELETE(request: Request) {
  const authResult = await requireUser([UserRole.FAMILY, UserRole.PROFESSIONAL, UserRole.ADMIN], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  const bodyResult = await parseJsonBody(request, removeSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  await prisma.pushToken.deleteMany({
    where: { token: bodyResult.data.token, userId: authResult.user.id },
  });

  return ok({ success: true });
}
