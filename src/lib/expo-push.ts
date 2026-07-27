/**
 * Sends push notifications to Expo's hosted push service.
 * https://docs.expo.dev/push-notifications/sending-notifications/
 *
 * Failures are logged but never thrown — push delivery is best-effort
 * and must never break the main request flow.
 */
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { logger } from "@/lib/logger";
import { withRetry } from "@/lib/retry";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_PUSH_TOKEN_PATTERN = /^ExponentPushToken\[[^\]]+\]$/;

export interface ExpoPushMessage {
  to: string | string[];
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
  priority?: "default" | "normal" | "high";
}

export async function sendExpoPushNotifications(
  messages: ExpoPushMessage[],
): Promise<void> {
  if (messages.length === 0) return;

  // Filter to valid Expo push tokens (ExponentPushToken[...])
  const valid = messages.filter(
    (m) =>
      typeof m.to === "string"
        ? EXPO_PUSH_TOKEN_PATTERN.test(m.to)
        : m.to.every((t) => EXPO_PUSH_TOKEN_PATTERN.test(t)),
  );

  if (valid.length === 0) return;

  try {
    await withRetry(
      async () => {
        const response = await fetchWithTimeout(EXPO_PUSH_URL, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(valid),
          timeoutMs: 10_000,
        });

        if (!response.ok) {
          const error = new Error(
            `Expo push API returned ${response.status}: ${await response.text().catch(() => "")}`,
          ) as Error & { status?: number };
          error.status = response.status;
          throw error;
        }
      },
      {
        maxRetries: 2,
        backoffMs: 500,
        shouldRetry: (error) => {
          const status = (error as { status?: number })?.status;
          return status === 429 || status === undefined || status >= 500;
        },
      });
  } catch (error) {
    logger.error("Expo push delivery failed after retries", error);
  }
}
