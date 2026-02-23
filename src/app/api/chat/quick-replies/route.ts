import { requireUser } from "@/lib/auth-guard";
import { getQuickRepliesForRole } from "@/lib/chat-quick-replies";
import { ok } from "@/lib/http";
import { UserRole } from "@prisma/client";

export async function GET() {
  const authResult = await requireUser([UserRole.FAMILY, UserRole.PROFESSIONAL, UserRole.ADMIN]);
  if ("response" in authResult) {
    return authResult.response;
  }

  return ok({
    items: getQuickRepliesForRole(authResult.user.role),
  });
}
