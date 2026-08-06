import type { SessionUser } from "@/src/lib/types/auth";

export function resolveHomePath(user: SessionUser | null) {
  if (!user) {
    return "/(public)/login";
  }

  if (!user.role) {
    return "/(protected)/onboarding";
  }

  if (user.needsLegalConsent) {
    return "/(protected)/consent";
  }

  if (user.role === "FAMILY") {
    return "/(family)";
  }

  if (user.role === "PROFESSIONAL") {
    return "/(professional)";
  }

  if (user.role === "ADMIN") {
    return "/(admin)";
  }

  return "/(protected)/unsupported-role";
}

export function isLegalPath(pathname: string | null) {
  if (!pathname) {
    return false;
  }

  return pathname.endsWith("/terms") || pathname.endsWith("/privacy");
}
