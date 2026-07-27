import { AppIcon } from "@/components/theme/app-icon";
import { DataCard } from "@/components/theme/data-card";
import { DataTableShell } from "@/components/theme/data-table-shell";
import { PageHeader } from "@/components/theme/page-header";
import { StatusBadge } from "@/components/theme/status-badge";
import { getAdminMetrics, MetricsWindow } from "@/lib/admin-metrics";
import { prisma } from "@/lib/prisma";
import {
  Activity,
  AlertTriangle,
  CalendarRange,
  ClipboardList,
  Flag,
  LineChart,
  ScrollText,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import Link from "next/link";
import { PendingUsersPanel } from "./pending-users-panel";

export const revalidate = 60;

type SearchParams = Promise<{
  window?: string;
}>;

const quickActions = [
  {
    href: "/admin/approvals",
    icon: ClipboardList,
    label: "Aprovações",
    description: "Revisar contas pendentes de ativação",
    color: "var(--admin-warning)",
    bg: "rgba(245, 179, 71, 0.1)",
    border: "rgba(245, 179, 71, 0.25)",
  },
  {
    href: "/admin/reports",
    icon: Flag,
    label: "Denúncias",
    description: "Moderar denúncias abertas",
    color: "var(--admin-danger)",
    bg: "rgba(244, 113, 116, 0.1)",
    border: "rgba(244, 113, 116, 0.25)",
  },
  {
    href: "/admin/professionals",
    icon: Stethoscope,
    label: "Profissionais",
    description: "Gerenciar perfis e documentos",
    color: "var(--admin-accent)",
    bg: "rgba(124, 142, 255, 0.1)",
    border: "rgba(124, 142, 255, 0.25)",
  },
  {
    href: "/admin/families",
    icon: Users,
    label: "Famílias",
    description: "Visualizar contas de famílias",
    color: "var(--admin-success)",
    bg: "rgba(57, 210, 138, 0.1)",
    border: "rgba(57, 210, 138, 0.25)",
  },
  {
    href: "/admin/audit",
    icon: ScrollText,
    label: "Auditoria",
    description: "Log completo de ações administrativas",
    color: "var(--admin-text-dim)",
    bg: "rgba(141, 153, 196, 0.1)",
    border: "rgba(141, 153, 196, 0.2)",
  },
  {
    href: "/admin/invites",
    icon: ShieldCheck,
    label: "Convites Admin",
    description: "Criar e gerenciar convites de admin",
    color: "var(--admin-accent)",
    bg: "rgba(124, 142, 255, 0.08)",
    border: "rgba(124, 142, 255, 0.2)",
  },
  {
    href: "/admin/leads",
    icon: Users,
    label: "Leads do piloto",
    description: "Priorizar contatos por cidade e papel",
    color: "var(--admin-success)",
    bg: "rgba(57, 210, 138, 0.08)",
    border: "rgba(57, 210, 138, 0.2)",
  },
] as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
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
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, createdAt: true, status: true },
      take: 200,
    }),
  ]);

  const urgentCount = (pendingUsers.length) + openReports + pendingDocs;

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Painel administrativo"
        description="Visão consolidada de operação, moderação e métricas do marketplace Cuidou."
        actions={
          <div
            className="flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-2 text-sm"
            style={{ borderColor: "var(--admin-border)", background: "var(--admin-panel)" }}
          >
            <span className="inline-flex items-center gap-1.5" style={{ color: "var(--admin-text-dim)" }}>
              <AppIcon icon={CalendarRange} size="sm" />
              Janela:
            </span>
            {([7, 30, 90] as const).map((value) => {
              const isWindowActive = value === metrics.windowDays;
              return (
                <Link
                  key={value}
                  href={`/admin?window=${value}`}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={
                    isWindowActive
                      ? { background: "var(--admin-accent)", color: "#0b1020" }
                      : { border: "1px solid var(--admin-border)", color: "var(--admin-text-dim)" }
                  }
                >
                  {value}d
                </Link>
              );
            })}
          </div>
        }
      />

      {/* Urgent alert banner */}
      {urgentCount > 0 && (
        <div
          className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium"
          style={{
            borderColor: "rgba(245, 179, 71, 0.4)",
            background: "rgba(245, 179, 71, 0.08)",
            color: "var(--admin-warning)",
          }}
        >
          <AlertTriangle size={16} />
          <span>
            {urgentCount} item{urgentCount !== 1 ? "s" : ""} requer{urgentCount === 1 ? "" : "em"} atenção:
            {pendingUsers.length > 0 && ` ${pendingUsers.length} aprovação(ões)`}
            {pendingUsers.length > 0 && openReports > 0 && ","}
            {openReports > 0 && ` ${openReports} denúncia(s)`}
            {(pendingUsers.length > 0 || openReports > 0) && pendingDocs > 0 && ","}
            {pendingDocs > 0 && ` ${pendingDocs} documento(s)`}
          </span>
        </div>
      )}

      {/* KPI cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DataCard label="Docs em revisão" value={pendingDocs} tone="tint" />
        <DataCard label="Denúncias abertas" value={openReports} tone="surface" />
        <DataCard label="Total de usuários" value={totalUsers} tone="surface" />
        <DataCard label="Vagas abertas" value={openJobs} tone="deep" />
      </section>

      {/* Secondary metrics */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <DataCard
          label="Tempo médio até contratar"
          value={metrics.averageTimeToHireHours === null ? "—" : `${metrics.averageTimeToHireHours}h`}
          tone="surface"
        />
        <DataCard label="Taxa de resposta 24h" value={`${metrics.responseRate24h}%`} tone="surface" />
        <DataCard label="Contratos em andamento" value={metrics.contractsByStatus.IN_PROGRESS} tone="tint" />
      </section>

      <DataTableShell
        title="Funil operacional"
        description="Conversão dos principais marcos do marketplace na janela selecionada; cadastros ativos são o proxy de aprovação até existir timestamp dedicado."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <DataCard label="Cadastros ativos" value={metrics.funnel.activeRegistrations} tone="surface" />
          <DataCard label="Perfis completos" value={metrics.funnel.completeProfiles} tone="surface" />
          <DataCard label="Vagas publicadas" value={metrics.funnel.publishedJobs} tone="surface" />
          <DataCard label="Candidaturas" value={metrics.funnel.applications} tone="surface" />
          <DataCard label="Aceitas" value={metrics.funnel.acceptedApplications} tone="surface" />
          <DataCard label="Contratos iniciados" value={metrics.funnel.contractsStarted} tone="tint" />
          <DataCard label="Contratos concluídos" value={metrics.funnel.contractsCompleted} tone="deep" />
        </div>
      </DataTableShell>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DataCard label="Leads capturados" value={metrics.commercialEvents.lead_captured ?? 0} tone="tint" />
        <DataCard label="Cadastros concluídos" value={metrics.commercialEvents.signup_completed ?? 0} tone="surface" />
        <DataCard label="Candidaturas instrumentadas" value={metrics.commercialEvents.application_submitted ?? 0} tone="surface" />
        <DataCard label="Contratos concluídos" value={metrics.commercialEvents.contract_completed ?? 0} tone="deep" />
        <DataCard label="Perfis ativados" value={metrics.commercialEvents.profile_completed ?? 0} tone="surface" />
        <DataCard label="Logins mobile" value={metrics.commercialEvents.login_completed ?? 0} tone="surface" />
        <DataCard label="Avaliações enviadas" value={metrics.commercialEvents.review_submitted ?? 0} tone="surface" />
        <DataCard label="Denúncias enviadas" value={metrics.commercialEvents.report_submitted ?? 0} tone="surface" />
      </section>

      {/* Quick Actions */}
      <section>
        <p
          className="mb-3 text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--admin-text-dim)" }}
        >
          Ações rápidas
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-4 rounded-2xl border p-4 transition-all hover:scale-[1.01]"
                style={{ borderColor: action.border, background: action.bg }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{ background: action.bg, border: `1px solid ${action.border}` }}
                >
                  <Icon size={18} style={{ color: action.color }} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
                    {action.label}
                  </p>
                  <p className="mt-0.5 truncate text-xs" style={{ color: "var(--admin-text-dim)" }}>
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Applications trend table */}
      <DataTableShell
        title="Tendência diária de candidaturas"
        description="Volume de candidaturas por dia no período selecionado."
        actions={
          <Link
            href={`/api/admin/metrics?window=${windowDays}`}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ borderColor: "var(--admin-border)", color: "var(--admin-text-dim)" }}
          >
            <Activity size={12} />
            API
          </Link>
        }
      >
        {metrics.applicationsTrendDaily.length === 0 ? (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "var(--admin-panel-2)", color: "var(--admin-text-dim)" }}
          >
            Sem candidaturas no período selecionado.
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.applicationsTrendDaily.map((entry) => (
              <li
                key={entry.date}
                className="flex items-center justify-between rounded-xl px-3 py-3"
                style={{ background: "var(--admin-panel-2)", border: "1px solid var(--admin-border)" }}
              >
                <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--admin-text)" }}>
                  <AppIcon icon={LineChart} size="sm" />
                  {entry.date}
                </span>
                <StatusBadge tone="blue">{entry.count}</StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </DataTableShell>

      {/* Denúncias por tipo */}
      <DataTableShell
        title="Denúncias por tipo"
        description="Distribuição por alvo para priorizar regras de moderação."
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

      {/* Pending users panel at the bottom — urgency items */}
      <PendingUsersPanel
        initialUsers={pendingUsers.map((user) => ({
          ...user,
          status: "PENDING" as const,
          createdAt: user.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
