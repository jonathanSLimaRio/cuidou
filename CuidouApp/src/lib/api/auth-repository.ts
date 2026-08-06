import { apiRequest } from "@/src/lib/api/client";
import { getRuntimeSession } from "@/src/lib/session/runtime-session";
import type {
  AuthSession,
  LoginPayload,
  OnboardingPayload,
  OnboardingResult,
  SessionUser,
  SignupPayload,
  SignupResult,
} from "@/src/lib/types/auth";

type MobileAuthPayload = {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
};

function parseAuthSession(payload: unknown, fallback: AuthSession | null = null): AuthSession {
  if (!payload || typeof payload !== "object") {
    if (fallback) {
      return fallback;
    }
    throw new Error("Invalid auth payload");
  }

  const direct = payload as Partial<MobileAuthPayload> & {
    session?: Partial<MobileAuthPayload>;
    user?: SessionUser;
  };
  const nested = direct.session;
  const candidate = nested ?? direct;

  const accessToken = candidate.accessToken ?? fallback?.accessToken;
  const refreshToken = candidate.refreshToken ?? fallback?.refreshToken;
  const user = candidate.user ?? direct.user ?? fallback?.user;

  if (!accessToken || !refreshToken || !user) {
    throw new Error("Auth payload missing fields");
  }

  return {
    accessToken,
    refreshToken,
    user,
  };
}

export const authRepository = {
  async loginWithPassword(input: LoginPayload): Promise<AuthSession> {
    const payload = await apiRequest<unknown>("/api/mobile/auth/login", {
      method: "POST",
      json: input,
    });
    return parseAuthSession(payload);
  },

  async loginWithGoogle(idToken: string): Promise<AuthSession> {
    const payload = await apiRequest<unknown>("/api/mobile/auth/google", {
      method: "POST",
      json: { idToken },
    });
    return parseAuthSession(payload);
  },

  async refresh(refreshToken: string): Promise<AuthSession> {
    const payload = await apiRequest<unknown>("/api/mobile/auth/refresh", {
      method: "POST",
      retryAuth: false,
      json: { refreshToken },
    });
    return parseAuthSession(payload, getRuntimeSession());
  },

  async getSession(): Promise<AuthSession> {
    const payload = await apiRequest<unknown>("/api/mobile/auth/session", {
      method: "GET",
      auth: true,
      retryAuth: false,
    });
    return parseAuthSession(payload, getRuntimeSession());
  },

  async logout(refreshToken: string | null): Promise<void> {
    await apiRequest<unknown>("/api/mobile/auth/logout", {
      method: "POST",
      auth: true,
      retryAuth: false,
      json: { refreshToken },
    });
  },

  async signup(input: SignupPayload): Promise<SignupResult> {
    const payload = await apiRequest<{ message?: string }>("/api/auth/signup", {
      method: "POST",
      json: input,
    });
    return {
      message:
        payload.message ??
        "Cadastro enviado com sucesso. Sua conta está pendente de aprovação administrativa.",
    };
  },

  async completeOnboarding(input: OnboardingPayload): Promise<OnboardingResult> {
    return apiRequest<OnboardingResult>("/api/onboarding/role", {
      method: "POST",
      auth: true,
      json: input,
    });
  },

  async acceptCurrentLegalConsent(): Promise<void> {
    await apiRequest("/api/legal/consent", {
      method: "POST",
      auth: true,
      json: { acceptedTerms: true, acceptedPrivacy: true },
    });
  },
};
