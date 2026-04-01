import authConfig from "@/auth.config";
import { UserRole } from "@prisma/client";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const start = Date.now();
  const { pathname, method } = req.nextUrl;
  const requestId = crypto.randomUUID();

  // Allow the invite acceptance page — it's public (uses a one-time token)
  if (pathname.startsWith("/admin/invite/accept")) {
    return NextResponse.next();
  }

  const session = req.auth;

  let response: NextResponse;

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    response = NextResponse.redirect(loginUrl);
  } else if (session.user.role !== UserRole.ADMIN) {
    response = NextResponse.redirect(new URL("/dashboard", req.url));
  } else {
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
  response.headers.set("X-Request-ID", requestId);

  return response;
});

export const config = {
  matcher: ["/admin/:path*"],
};
