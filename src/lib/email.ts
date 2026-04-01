import { logger } from "@/lib/logger";
import { withRetry } from "@/lib/retry";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const from = process.env.RESEND_FROM_EMAIL ?? "no-reply@cuidou.app";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    logger.warn("Email not sent — RESEND_API_KEY not configured", { to: params.to, subject: params.subject });
    return;
  }

  try {
    await withRetry(
      () =>
        resend.emails.send({
          from,
          to: params.to,
          subject: params.subject,
          html: params.html,
        }),
      {
        maxRetries: 2,
        backoffMs: 1_000,
        shouldRetry: (error) => {
          // Don't retry on 4xx client errors (bad address, etc.)
          if (error instanceof Error && error.message.includes("4")) return false;
          return true;
        },
      },
    );
  } catch (error) {
    logger.error("Failed to send email after retries", error, { to: params.to, subject: params.subject });
  }
}
