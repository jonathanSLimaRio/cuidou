import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { type PropsWithChildren, useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAuth } from "@/src/hooks/use-auth";
import { pushTokenRepository } from "@/src/lib/api/push-token-repository";
import { registerForPushNotificationsAsync } from "@/src/lib/push-notifications";

// Show alerts while the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

type NotificationData = {
  notificationType?: string;
  conversationId?: string;
  applicationId?: string;
  jobId?: string;
};

function resolveNavigationTarget(
  data: NotificationData,
  role: string | undefined,
): string | null {
  const { notificationType, conversationId } = data;

  switch (notificationType) {
    case "CHAT_MESSAGE":
      return conversationId ? `/(protected)/chat/${conversationId}` : null;

    case "APPLICATION_RECEIVED":
      return "/(family)/applications";

    case "APPLICATION_STATUS_UPDATED":
      return role === "PROFESSIONAL" ? "/(professional)/applications" : "/(family)/applications";

    case "INVITATION_RECEIVED":
    case "INVITATION_STATUS_UPDATED":
      return "/(professional)/invitations";

    case "CONTRACT_STATUS_UPDATED":
      return role === "PROFESSIONAL" ? "/(professional)/contracts" : "/(family)/contracts";

    case "DOCUMENT_STATUS_UPDATED":
      return "/(professional)/documents";

    default:
      return null;
  }
}

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const registeredForRef = useRef<string | null>(null);
  const pushTokenRef = useRef<string | null>(null);

  // Register / refresh push token when user authenticates
  useEffect(() => {
    if (!isAuthenticated || !user || registeredForRef.current === user.id) return;

    const register = async () => {
      const token = await registerForPushNotificationsAsync();
      if (!token) return;

      pushTokenRef.current = token;
      registeredForRef.current = user.id;

      try {
        await pushTokenRepository.registerToken(token, Platform.OS);
      } catch {
        // Token registration is best-effort — don't break the app
      }
    };

    void register();
  }, [isAuthenticated, user]);

  // Remove push token when user logs out
  useEffect(() => {
    if (isAuthenticated) return;

    const token = pushTokenRef.current;
    if (!token) return;

    pushTokenRef.current = null;
    registeredForRef.current = null;

    void pushTokenRepository.removeToken(token).catch(() => undefined);
  }, [isAuthenticated]);

  // Handle notification tap (foreground + background)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as NotificationData;
        const target = resolveNavigationTarget(data, user?.role ?? undefined);
        if (target) {
          router.push(target as Parameters<typeof router.push>[0]);
        }
      },
    );

    return () => subscription.remove();
  }, [router, user?.role]);

  // Handle the notification that launched the app from killed state
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        const data = response.notification.request.content.data as NotificationData;
        const target = resolveNavigationTarget(data, user?.role ?? undefined);
        if (target) {
          router.push(target as Parameters<typeof router.push>[0]);
        }
      })
      .catch(() => undefined);
  // Only run after auth is fully hydrated so we know the user's role
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
