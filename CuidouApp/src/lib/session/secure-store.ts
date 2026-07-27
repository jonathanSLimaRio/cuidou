import * as SecureStore from "expo-secure-store";

import type { AuthSession } from "@/src/lib/types/auth";

const SESSION_KEY = "cuidou.mobile.session.v1";

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AuthSession> & { user?: Partial<AuthSession["user"]> };
  const user = candidate.user;

  return Boolean(
    typeof candidate.accessToken === "string" &&
      candidate.accessToken.length > 20 &&
      typeof candidate.refreshToken === "string" &&
      candidate.refreshToken.length > 20 &&
      user &&
      typeof user.id === "string" &&
      typeof user.email === "string" &&
      typeof user.status === "string",
  );
}

export async function saveAuthSession(session: AuthSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function loadAuthSession(): Promise<AuthSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isAuthSession(parsed)) {
      await clearAuthSession();
      return null;
    }

    return parsed;
  } catch {
    await clearAuthSession();
    return null;
  }
}

export async function clearAuthSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
