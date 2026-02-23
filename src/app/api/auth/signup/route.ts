import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/request";
import { localSignupSchema } from "@/lib/schemas";
import { UserStatus } from "@prisma/client";
import { hash } from "bcryptjs";

export async function POST(request: Request) {
  const bodyResult = await parseJsonBody(request, localSignupSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  const payload = bodyResult.data;
  const email = payload.email.trim().toLowerCase();

  const existing = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (existing) {
    return fail(409, "Já existe uma conta com este e-mail.");
  }

  const passwordHash = await hash(payload.password, 12);

  await prisma.user.create({
    data: {
      name: payload.name.trim(),
      email,
      passwordHash,
      status: UserStatus.PENDING,
    },
  });

  return ok(
    {
      message:
        "Cadastro enviado. Sua conta está pendente de aprovação da equipe administrativa.",
    },
    201,
  );
}
