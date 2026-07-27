import { requireUser } from "@/lib/auth-guard";
import { getQuickRepliesForRole } from "@/lib/chat-quick-replies";
import { ok } from "@/lib/http";
import { UserRole } from "@prisma/client";

export async function GET(request: Request) {
  const authResult = await requireUser([UserRole.FAMILY, UserRole.PROFESSIONAL, UserRole.ADMIN], request);
  if ("response" in authResult) {
    return authResult.response;
  }

  return ok({
    items: getQuickRepliesForRole(authResult.user.role),
  });
}
