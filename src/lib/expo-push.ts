/**
 * Sends push notifications to Expo's hosted push service.
 * https://docs.expo.dev/push-notifications/sending-notifications/
 *
 * Failures are logged but never thrown — push delivery is best-effort
 * and must never break the main request flow.
 */
import { logger } from "@/lib/logger";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

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
        ? m.to.startsWith("ExponentPushToken[")
        : m.to.every((t) => t.startsWith("ExponentPushToken[")),
  );

  if (valid.length === 0) return;

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(valid),
    });

    if (!response.ok) {
      logger.error("Expo push API returned non-OK status", {
        status: response.status,
        body: await response.text(),
      });
    }
  } catch (error) {
    logger.error("Expo push network error", error);
  }
}
