import { ok } from "@/lib/http";
import {
  mobileAuthErrorResponse,
  requireMobileUser,
  toMobileUser,
} from "@/lib/mobile-auth";

export async function GET(request: Request) {
  try {
    const user = await requireMobileUser(request);
    return ok({ user: toMobileUser(user) });
  } catch (error) {
    return mobileAuthErrorResponse(error);
  }
}
