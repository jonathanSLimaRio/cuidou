import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "./admin-shell";

/**
 * Layout for the protected admin area.
 *
 * Runs two checks as defense in depth on top of the middleware:
 *  1. Session must exist (otherwise redirect to /admin/login)
 *  2. role === ADMIN (otherwise redirect to /dashboard)
 *
 * The middleware (src/proxy.ts) already blocks unauthenticated/non-admin
 * users at the edge using the JWT claim. This server-side check is a second
 * layer that also catches stale role claims.
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

  // Fetch badge counts for sidebar
  const [pendingCount, reportCount] = await Promise.all([
    prisma.user.count({ where: { status: "PENDING", passwordHash: { not: null } } }),
    prisma.report.count({ where: { status: { in: ["OPEN", "IN_REVIEW"] } } }),
  ]);

  return (
    <AdminShell
      user={{
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      }}
      pendingCount={pendingCount}
      reportCount={reportCount}
    >
      {children}
    </AdminShell>
  );
}
