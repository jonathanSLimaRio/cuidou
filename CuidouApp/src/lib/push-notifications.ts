import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Requests push notification permission and returns the Expo push token.
 * Returns null if permission is denied or the device doesn't support push
 * (e.g. simulators, web).
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Notificações",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4962C7",
      showBadge: true,
    });
  }

  try {
    const projectId =
      // EAS build: populated via app.json extra.eas.projectId
      (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.eas
        ?.projectId as string | undefined ??
      Constants.easConfig?.projectId;

    const tokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    return tokenResult.data;
  } catch {
    // Thrown on simulators or when EAS project is not configured.
    // Silently return null — push is non-critical.
    return null;
  }
}
