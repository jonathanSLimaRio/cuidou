import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "./admin-shell";

/**
 * Layout for the protected admin area.
 *
 * Runs two checks as defense in depth on top of the middleware:
 *  1. Session must exist (otherwise redirect to /login).
 *  2. role === ADMIN (otherwise redirect to /dashboard).
 *
 * The middleware (src/middleware.ts) already blocks unauthenticated/non-admin
 * users at the edge using the JWT claim. This server-side check is a second
 * layer that also runs for API-less flows (e.g. prerendering) and would catch
 * a stale role claim in the JWT since `auth()` resolves against the DB-synced
 * token maintained in auth.ts.
 */
export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard?error=admin_only");
  }

  return (
    <AdminShell
      user={{
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      }}
    >
      {children}
    </AdminShell>
  );
}
