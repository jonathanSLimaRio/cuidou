import {
  AppState,
  type AppStateStatus,
} from "react-native";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ApiClientError, registerApiAuthHooks } from "@/src/lib/api/client";
import { authRepository } from "@/src/lib/api/auth-repository";
import { setSentryUserContext } from "@/src/lib/sentry";
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
} from "@/src/lib/session/secure-store";
import {
  getRefreshToken,
  getRuntimeSession,
  setRuntimeSession,
} from "@/src/lib/session/runtime-session";
import type {
  AuthLifecycleStatus,
  AuthSession,
  LoginPayload,
  OnboardingPayload,
  SessionUser,
  SignupPayload,
  SignupResult,
} from "@/src/lib/types/auth";

type AuthContextValue = {
  status: AuthLifecycleStatus;
  isHydrated: boolean;
  isAuthenticated: boolean;
  user: SessionUser | null;
  signInWithPassword: (payload: LoginPayload) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signUp: (payload: SignupPayload) => Promise<SignupResult>;
  completeOnboarding: (payload: OnboardingPayload) => Promise<void>;
  refreshSession: () => Promise<boolean>;
  syncSession: () => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const FOREGROUND_SYNC_MIN_INTERVAL_MS = 60_000;

function is401(error: unknown) {
  return error instanceof ApiClientError && error.status === 401;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthLifecycleStatus>("unauthenticated");
  const [isHydrated, setIsHydrated] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);
  const lastForegroundSyncAtRef = useRef(0);

  const persistSession = useCallback(async (session: AuthSession) => {
    setRuntimeSession(session);
    setUser(session.user);
    await saveAuthSession(session);
  }, []);

  const clearSession = useCallback(async () => {
    setRuntimeSession(null);
    setUser(null);
    await clearAuthSession();
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshTask = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const previousStatus = status;
      setStatus("refreshing");

      try {
        const refreshed = await authRepository.refresh(refreshToken);
        await persistSession(refreshed);
        setStatus("authenticated");
        return true;
      } catch {
        await clearSession();
        setStatus("unauthenticated");
        return false;
      } finally {
        if (previousStatus === "authenticated" && getRuntimeSession()) {
          setStatus("authenticated");
        }
      }
    })();

    refreshPromiseRef.current = refreshTask;

    try {
      return await refreshTask;
    } finally {
      refreshPromiseRef.current = null;
    }
  }, [clearSession, persistSession, status]);

  const syncSession = useCallback(async () => {
    const currentSession = getRuntimeSession();
    if (!currentSession) {
      return false;
    }

    try {
      const synced = await authRepository.getSession();
      await persistSession(synced);
      setStatus("authenticated");
      return true;
    } catch (error) {
      if (is401(error)) {
        const refreshed = await refreshSession();
        if (!refreshed) {
          return false;
        }

        try {
          const synced = await authRepository.getSession();
          await persistSession(synced);
          setStatus("authenticated");
          return true;
        } catch {
          await clearSession();
          setStatus("unauthenticated");
          return false;
        }
      }

      return false;
    }
  }, [clearSession, persistSession, refreshSession]);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      await authRepository.logout(refreshToken);
    } catch {
      // Logout local deve funcionar mesmo sem resposta do backend.
    } finally {
      await clearSession();
      setStatus("unauthenticated");
    }
  }, [clearSession]);

  const hydrate = useCallback(async () => {
    setStatus("refreshing");
    const stored = await loadAuthSession();
    if (!stored) {
      setStatus("unauthenticated");
      setIsHydrated(true);
      return;
    }

    setRuntimeSession(stored);
    setUser(stored.user);

    const synced = await syncSession();
    if (!synced) {
      await clearSession();
      setStatus("unauthenticated");
    }

    setIsHydrated(true);
  }, [clearSession, syncSession]);

  const signInWithPassword = useCallback(
    async (payload: LoginPayload) => {
      setStatus("authenticating");
      try {
        const session = await authRepository.loginWithPassword(payload);
        await persistSession(session);
        setStatus("authenticated");
      } catch (error) {
        await clearSession();
        setStatus("unauthenticated");
        throw error;
      }
    },
    [clearSession, persistSession],
  );

  const signInWithGoogle = useCallback(
    async (idToken: string) => {
      setStatus("authenticating");
      try {
        const session = await authRepository.loginWithGoogle(idToken);
        await persistSession(session);
        setStatus("authenticated");
      } catch (error) {
        await clearSession();
        setStatus("unauthenticated");
        throw error;
      }
    },
    [clearSession, persistSession],
  );

  const signUp = useCallback(async (payload: SignupPayload) => {
    return authRepository.signup(payload);
  }, []);

  const completeOnboarding = useCallback(
    async (payload: OnboardingPayload) => {
      setStatus("refreshing");
      try {
        await authRepository.completeOnboarding(payload);
        const synced = await syncSession();
        if (!synced) {
          throw new Error("failed_to_sync_session");
        }
      } catch (error) {
        setStatus(getRuntimeSession() ? "authenticated" : "unauthenticated");
        throw error;
      }
    },
    [syncSession],
  );

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    registerApiAuthHooks({
      refreshSession,
      onUnauthorized: async () => {
        await clearSession();
        setStatus("unauthenticated");
      },
    });
  }, [clearSession, refreshSession]);

  useEffect(() => {
    setSentryUserContext(user);
  }, [user]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextStatus: AppStateStatus) => {
        if (nextStatus !== "active" || !getRuntimeSession()) {
          return;
        }

        const now = Date.now();
        if (now - lastForegroundSyncAtRef.current < FOREGROUND_SYNC_MIN_INTERVAL_MS) {
          return;
        }

        lastForegroundSyncAtRef.current = now;
        void syncSession();
      },
    );

    return () => {
      subscription.remove();
    };
  }, [syncSession]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      status,
      isHydrated,
      isAuthenticated: Boolean(user),
      user,
      signInWithPassword,
      signInWithGoogle,
      signUp,
      completeOnboarding,
      refreshSession,
      syncSession,
      logout,
    }),
    [
      completeOnboarding,
      isHydrated,
      logout,
      refreshSession,
      signInWithGoogle,
      signInWithPassword,
      signUp,
      status,
      syncSession,
      user,
    ],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }

  return context;
}
