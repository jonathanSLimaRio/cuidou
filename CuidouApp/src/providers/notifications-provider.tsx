import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { type PropsWithChildren, useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAuth } from "@/src/hooks/use-auth";
import { pushTokenRepository } from "@/src/lib/api/push-token-repository";
import { registerForPushNotificationsAsync } from "@/src/lib/push-notifications";
import {
  normalizeNotificationPayload,
  resolveNotificationNavigationTarget,
} from "@/src/navigation/notification-routing";

// Show alerts while the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { user, isAuthenticated, isHydrated } = useAuth();
  const router = useRouter();

  const registeredForRef = useRef<string | null>(null);
  const pushTokenRef = useRef<string | null>(null);
  const handledResponseKeysRef = useRef<Set<string>>(new Set());

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      if (!isHydrated) return;

      const requestId = response.notification.request.identifier;
      const actionId = response.actionIdentifier ?? "default";
      const responseKey = `${requestId}:${actionId}`;

      if (handledResponseKeysRef.current.has(responseKey)) {
        return;
      }
      if (handledResponseKeysRef.current.size > 200) {
        handledResponseKeysRef.current.clear();
      }
      handledResponseKeysRef.current.add(responseKey);

      const payload = normalizeNotificationPayload(response.notification.request.content.data);
      const target = resolveNotificationNavigationTarget(payload, user?.role ?? undefined);
      if (target) {
        router.push(target as Parameters<typeof router.push>[0]);
      }
    },
    [isHydrated, router, user?.role],
  );

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
    if (!isHydrated) return;

    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    return () => subscription.remove();
  }, [handleNotificationResponse, isHydrated]);

  // Handle the notification that launched the app from killed state
  useEffect(() => {
    if (!isHydrated) return;

    let isCancelled = false;

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response || isCancelled) return;
        handleNotificationResponse(response);
      })
      .catch(() => undefined);

    return () => {
      isCancelled = true;
    };
  }, [handleNotificationResponse, isHydrated]);

  useEffect(() => {
    handledResponseKeysRef.current.clear();
  }, [user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !isHydrated) {
      handledResponseKeysRef.current.clear();
    }
  }, [isAuthenticated, isHydrated]);

  return <>{children}</>;
}
