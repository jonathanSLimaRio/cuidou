import { fail, ok } from "@/lib/http";
import {
  mobileAuthErrorResponse,
  rotateMobileSession,
} from "@/lib/mobile-auth";
import { parseJsonBody } from "@/lib/request";
import { mobileRefreshSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const bodyResult = await parseJsonBody(request, mobileRefreshSchema);
  if ("response" in bodyResult) {
    return bodyResult.response ?? fail(422, "Invalid payload");
  }

  try {
    return ok(await rotateMobileSession(bodyResult.data.refreshToken));
  } catch (error) {
    return mobileAuthErrorResponse(error);
  }
}
