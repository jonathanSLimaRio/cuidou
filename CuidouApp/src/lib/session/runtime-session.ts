import type { AuthSession } from "@/src/lib/types/auth";

let runtimeSession: AuthSession | null = null;

export function getRuntimeSession() {
  return runtimeSession;
}

export function setRuntimeSession(session: AuthSession | null) {
  runtimeSession = session;
}

export function getAccessToken() {
  return runtimeSession?.accessToken ?? null;
}

export function getRefreshToken() {
  return runtimeSession?.refreshToken ?? null;
}
