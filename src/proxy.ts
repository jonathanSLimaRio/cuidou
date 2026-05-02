import authConfig from "@/auth.config";
import { UserRole } from "@/lib/prisma-enums";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const protectedPagePrefixes = [
  "/dashboard",
  "/onboarding",
  "/family",
  "/professional",
  "/chat",
  "/admin",
];

// Public admin routes — accessible without a session (login page itself).
// MUST be checked before the protectedPagePrefixes guard to prevent
// an infinite redirect loop: /admin/login → blocked → /admin/login → ...
const publicAdminPaths = ["/admin/login", "/admin/invite/accept"];

function needsAuthForApi(pathname: string) {
  if (!pathname.startsWith("/api")) {
    return false;
  }

  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/api/health" ||
    pathname.startsWith("/api/jobs") ||
    pathname.startsWith("/api/professionals")
  ) {
    return false;
  }

  return true;
}

export default auth((req) => {
  const start = Date.now();
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const { pathname } = req.nextUrl;
  const method = req.method;
  const session = req.auth;

  // Public admin paths (login page, invite acceptance) — must bypass all guards.
  // Without this early-return, the /admin prefix guard would redirect any
  // unauthenticated request (including to /admin/login itself) in a tight loop.
  if (publicAdminPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    // If already authenticated as ADMIN, redirect away from the login page.
    if (pathname.startsWith("/admin/login") && session?.user?.role === UserRole.ADMIN) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    // Inject pathname so SiteHeader can suppress itself on /admin/* routes
    const reqHeaders = new Headers(req.headers);
    reqHeaders.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers: reqHeaders } });
  }

  const isProtectedPage = protectedPagePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isApiProtected = needsAuthForApi(pathname);

  // Inject pathname into request headers so Server Components (e.g. SiteHeader)
  // can detect the current route without using usePathname (client-only).
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-pathname", pathname);

  let response: NextResponse;

  // 1. Basic Auth Check for protected pages/APIs
  if ((isProtectedPage || isApiProtected) && !session?.user) {
    if (pathname.startsWith("/api")) {
      response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      const baseLogin = pathname.startsWith("/admin") ? "/admin/login" : "/login";
      const loginUrl = new URL(baseLogin, req.url);
      const nextPath = `${pathname}${req.nextUrl.search}`;
      loginUrl.searchParams.set("next", nextPath);
      response = NextResponse.redirect(loginUrl);
    }
  }
  // 2. Admin Role Check for /admin routes
  else if (
    pathname.startsWith("/admin") &&
    session?.user?.role !== UserRole.ADMIN
  ) {
    response = NextResponse.redirect(new URL("/dashboard", req.url));
  }
  // 3. Default allow — pass along injected request headers
  else {
    response = NextResponse.next({ request: { headers: reqHeaders } });
  }

  // Structured request log (edge-compatible via console)
  const duration = Date.now() - start;
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId,
      method,
      path: pathname,
      status: response.status,
      durationMs: duration,
      userId: session?.user?.id ?? null,
    }),
  );

  // Forward requestId and pathname for downstream correlation and route detection
  response.headers.set("x-request-id", requestId);
  response.headers.set("x-pathname", pathname);

  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
