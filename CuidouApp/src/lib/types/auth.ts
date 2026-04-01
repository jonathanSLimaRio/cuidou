export type AuthLifecycleStatus =
  | "unauthenticated"
  | "authenticating"
  | "authenticated"
  | "refreshing";

export type UserRole = "FAMILY" | "PROFESSIONAL" | "ADMIN" | null;
export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "BANNED";

export type AuthErrorCode =
  | "pending_approval"
  | "account_suspended"
  | "account_banned"
  | "credentials_invalid"
  | "unauthorized";

export type SessionUser = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
};

export type ApiErrorResponse = {
  error?: string;
  message?: string;
  code?: string;
  details?: unknown;
};

export type SignupPayload = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type SignupResult = {
  message: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type OnboardingRole = Exclude<UserRole, "ADMIN" | null>;

export type OnboardingPayload = {
  role: OnboardingRole;
  acceptTerms: true;
  acceptPrivacy: true;
};

export type OnboardingResult = {
  user: Pick<SessionUser, "id" | "role">;
  nextPath?: string;
};
