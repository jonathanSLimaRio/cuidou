import authConfig from "@/auth.config";
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
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const pathname = req.nextUrl.pathname;
  const isProtectedPage = protectedPagePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isApiProtected = needsAuthForApi(pathname);

  if ((isProtectedPage || isApiProtected) && !req.auth?.user) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", req.url);
    const nextPath = `${pathname}${req.nextUrl.search}`;
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);
  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
