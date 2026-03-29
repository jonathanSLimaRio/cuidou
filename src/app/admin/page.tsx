import { auth } from "@/auth";
import { AppShell } from "@/components/theme/app-shell";
import { AppIcon } from "@/components/theme/app-icon";
import { CtaButton } from "@/components/theme/cta-button";
import { DataCard } from "@/components/theme/data-card";
import { DataTableShell } from "@/components/theme/data-table-shell";
import { PageHeader } from "@/components/theme/page-header";
import { StatusBadge } from "@/components/theme/status-badge";
import { getAdminMetrics, MetricsWindow } from "@/lib/admin-metrics";
import { prisma } from "@/lib/prisma";
import { CalendarRange, LineChart, Puzzle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ModerationConsole } from "./moderation-console";
import { PendingUsersPanel } from "./pending-users-panel";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  window?: string;
}>;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const windowParam = resolvedSearchParams.window;
  const windowDays: MetricsWindow =
    windowParam === "7" || windowParam === "90" ? (Number(windowParam) as MetricsWindow) : 30;

  const [pendingDocs, openReports, totalUsers, openJobs, metrics, pendingUsers] = await Promise.all([
    prisma.professionalDocument.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.report.count({ where: { status: { in: ["OPEN", "IN_REVIEW"] } } }),
    prisma.user.count(),
    prisma.jobPost.count({ where: { status: "OPEN" } }),
    getAdminMetrics(windowDays),
    prisma.user.findMany({
      where: {
        status: "PENDING",
        passwordHash: {
          not: null,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        status: true,
      },
      take: 200,
    }),
  ]);

  return (
    <AppShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Admin" },
      ]}
    >
      <PageHeader
        eyebrow="Admin"
        title="Painel administrativo"
        description="Monitore moderação, operação e métricas principais do marketplace em uma visão consolidada."
        actions={
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--theme-border)] bg-white px-3 py-2 text-sm">
            <span className="inline-flex items-center gap-1.5 text-[var(--theme-muted)]">
              <AppIcon icon={CalendarRange} size="sm" />
              Janela:
            </span>
            {[7, 30, 90].map((value) => {
              const isActive = value === metrics.windowDays;

              return (
                <Link
                  key={value}
                  href={`/admin?window=${value}`}
                  className={`rounded-full px-3 py-1.5 ${
                    isActive
                      ? "bg-[var(--theme-indigo)] text-white"
                      : "border border-[var(--theme-border)] bg-white text-[var(--theme-body)]"
                  }`}
                >
                  {value} dias
                </Link>
              );
            })}
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DataCard label="Docs em revisão" value={pendingDocs} tone="tint" />
        <DataCard label="Denúncias abertas" value={openReports} tone="surface" />
        <DataCard label="Usuários" value={totalUsers} tone="surface" />
        <DataCard label="Vagas abertas" value={openJobs} tone="deep" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <DataCard
          label="Tempo médio até contratar"
          value={metrics.averageTimeToHireHours === null ? "-" : `${metrics.averageTimeToHireHours}h`}
          tone="surface"
        />
        <DataCard label="Taxa de resposta em 24h" value={`${metrics.responseRate24h}%`} tone="surface" />
        <DataCard label="Contratos em andamento" value={metrics.contractsByStatus.IN_PROGRESS} tone="tint" />
      </section>

      <DataTableShell
        title="Denúncias por tipo"
        description="Distribuição por alvo para priorizar regras de moderação e revisão operacional."
      >
        <div className="theme-table-wrap">
          <table className="theme-table min-w-[420px]">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metrics.reportsByTargetType).map(([type, count]) => (
                <tr key={type}>
                  <td>
                    <StatusBadge tone="info">{type}</StatusBadge>
                  </td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataTableShell>

      <DataTableShell
        title="Tendência diária de candidaturas"
        description="Série temporal para acompanhar volume de entrada e sazonalidade de demanda."
        actions={
          <CtaButton href="/api/admin/metrics?window=30" variant="outline" size="sm" icon={Puzzle}>
            API de métricas
          </CtaButton>
        }
      >
        {metrics.applicationsTrendDaily.length === 0 ? (
          <div className="theme-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
            Sem candidaturas no período selecionado.
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.applicationsTrendDaily.map((entry) => (
              <li key={entry.date} className="theme-list-card flex items-center justify-between px-3 py-3">
                <span className="inline-flex items-center gap-1.5 text-sm text-[var(--theme-body)]">
                  <AppIcon icon={LineChart} size="sm" />
                  {entry.date}
                </span>
                <StatusBadge tone="blue">{entry.count}</StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </DataTableShell>

      <PendingUsersPanel
        initialUsers={pendingUsers.map((user) => ({
          ...user,
          status: "PENDING" as const,
          createdAt: user.createdAt.toISOString(),
        }))}
      />

      <ModerationConsole />
    </AppShell>
  );
}
