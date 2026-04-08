import Constants from "expo-constants";
import * as Sentry from "@sentry/react-native";

import type { SessionUser } from "@/src/lib/types/auth";

let sentryInitialized = false;

function getSentryDsn() {
  const fromEnv = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }

  const fromExtra = Constants.expoConfig?.extra?.sentryDsn;
  return typeof fromExtra === "string" && fromExtra.trim().length > 0
    ? fromExtra.trim()
    : undefined;
}

function getSentryEnvironment() {
  const fromEnv = process.env.EXPO_PUBLIC_APP_ENV;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }

  const fromExtra = Constants.expoConfig?.extra?.appEnv;
  if (typeof fromExtra === "string" && fromExtra.trim().length > 0) {
    return fromExtra.trim();
  }

  return __DEV__ ? "development" : "production";
}

function getSentryRelease() {
  const fromEnv = process.env.EXPO_PUBLIC_APP_RELEASE;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }

  const slug = Constants.expoConfig?.slug ?? "cuidouapp";
  const version = Constants.expoConfig?.version ?? "0.0.0";
  return `${slug}@${version}`;
}

export function initSentry() {
  if (sentryInitialized) return;

  const dsn = getSentryDsn();
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    enabled: !__DEV__,
    environment: getSentryEnvironment(),
    release: getSentryRelease(),
    tracesSampleRate: 0.1,
  });

  Sentry.setTag("app_platform", "mobile");
  Sentry.setTag("runtime", "expo");
  sentryInitialized = true;
}

export function setSentryUserContext(user: SessionUser | null) {
  if (!sentryInitialized) return;

  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
  });
  Sentry.setTag("user_role", user.role ?? "UNKNOWN");
  Sentry.setTag("user_status", user.status);
}

export function captureSentryException(
  error: unknown,
  context?: Record<string, string | number | boolean | undefined>,
) {
  if (!sentryInitialized) return;

  const normalizedError = error instanceof Error ? error : new Error(String(error));
  if (!context) {
    Sentry.captureException(normalizedError);
    return;
  }

  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(context)) {
      if (value === undefined) continue;
      scope.setTag(key, String(value));
    }
    Sentry.captureException(normalizedError);
  });
}
