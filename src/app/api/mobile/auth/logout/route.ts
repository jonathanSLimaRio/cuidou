import { ok } from "@/lib/http";
import { mobileAuthErrorResponse, revokeMobileRefreshToken } from "@/lib/mobile-auth";
import { parseJsonBody } from "@/lib/request";
import { mobileLogoutSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const bodyResult = await parseJsonBody(request, mobileLogoutSchema);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  try {
    await revokeMobileRefreshToken(bodyResult.data.refreshToken);
    return ok({ success: true });
  } catch (error) {
    return mobileAuthErrorResponse(error);
  }
}
