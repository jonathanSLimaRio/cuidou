import authConfig from "@/auth.config";
import { UserRole } from "@prisma/client";
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

function needsAuthForApi(pathname: string) {
  if (!pathname.startsWith("/api")) {
    return false;
  }

  if (
    pathname.startsWith("/api/auth") ||
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

  // Allow the invite acceptance page — it's public (uses a one-time token)
  if (pathname.startsWith("/admin/invite/accept")) {
    return NextResponse.next();
  }

  const isProtectedPage = protectedPagePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isApiProtected = needsAuthForApi(pathname);

  let response: NextResponse;

  // 1. Basic Auth Check for protected pages/APIs
  if ((isProtectedPage || isApiProtected) && !session?.user) {
    if (pathname.startsWith("/api")) {
      response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      const loginUrl = new URL("/login", req.url);
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
  // 3. Default allow
  else {
    response = NextResponse.next();
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

  // Forward requestId so downstream API routes can correlate logs
  response.headers.set("x-request-id", requestId);

  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
