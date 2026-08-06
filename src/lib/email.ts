import { logger } from "@/lib/logger";
import { withRetry } from "@/lib/retry";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.RESEND_FROM_EMAIL ?? "no-reply@cuidou.app";

export type EmailDeliveryResult =
  | { sent: true; providerId: string | null }
  | { sent: false; errorCode: "not_configured" | "provider_rejected" | "provider_unavailable" };

export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<EmailDeliveryResult> {
  if (!resend) {
    logger.warn("Email not sent — RESEND_API_KEY not configured");
    return { sent: false, errorCode: "not_configured" };
  }

  try {
    const response = await withRetry(
      async () => {
        const result = await resend.emails.send({ from, to: params.to, subject: params.subject, html: params.html });
        if (result.error) {
          const error = new Error(result.error.message);
          Object.assign(error, { providerStatusCode: result.error.statusCode });
          throw error;
        }
        return result.data;
      },
      {
        maxRetries: 2,
        backoffMs: 1_000,
        shouldRetry: (error) => {
          const status = typeof error === "object" && error && "providerStatusCode" in error
            ? Number(error.providerStatusCode)
            : 0;
          return status === 0 || status >= 500;
        },
      },
    );
    return { sent: true, providerId: response?.id ?? null };
  } catch (error) {
    logger.error("Failed to send email after retries", error);
    const status = typeof error === "object" && error && "providerStatusCode" in error
      ? Number(error.providerStatusCode)
      : 0;
    return { sent: false, errorCode: status >= 400 && status < 500 ? "provider_rejected" : "provider_unavailable" };
  }
}
