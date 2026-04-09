import { DataTableShell } from "@/components/theme/data-table-shell";
import { PageHeader } from "@/components/theme/page-header";
import { StatusBadge } from "@/components/theme/status-badge";
import { prisma } from "@/lib/prisma";
import { ReportStatus } from "@prisma/client";
import { ReportsClient } from "./reports-client";

export const dynamic = "force-dynamic";

function reportTone(status: ReportStatus) {
  if (status === "RESOLVED") {
    return "success" as const;
  }
  if (status === "DISMISSED") {
    return "neutral" as const;
  }
  if (status === "IN_REVIEW") {
    return "info" as const;
  }
  return "warning" as const;
}

export default async function ReportsPage() {
  const reports = await prisma.report.findMany({
    where: { status: { in: [ReportStatus.OPEN, ReportStatus.IN_REVIEW] } },
    orderBy: { createdAt: "asc" },
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Compliance"
        title="Denúncias Administrativas"
        description="Gerencie denúncias ativas, investigue usuários e resolva conflitos."
      />

      <DataTableShell
        title="Fila de Moderação"
        description={`${reports.length} denúncias pendentes ou em revisão na fila.`}
      >
        {reports.length === 0 ? (
          <p className="theme-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
            A fila de denúncias está limpa.
          </p>
        ) : (
          <div className="theme-table-wrap">
            <table className="theme-table min-w-[820px]">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Denunciante</th>
                  <th>Alvo / Tipo</th>
                  <th>Motivo</th>
                  <th>Status</th>
                  <th className="text-right">Resolução</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="text-xs text-[var(--theme-muted)]">
                      {new Date(report.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span>{report.reporter.name ?? "Anônimo"}</span>
                        <span className="text-xs text-[var(--theme-muted)]">{report.reporter.email ?? "—"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[var(--theme-body)]">{report.targetType}</span>
                      </div>
                    </td>
                    <td>
                      <div className="max-w-[200px]">
                        <p className="font-medium text-sm text-[var(--theme-body)]">{report.reason}</p>
                        {report.details && (
                          <p className="mt-0.5 truncate text-xs text-[var(--theme-muted)]" title={report.details}>
                            {report.details}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <StatusBadge tone={reportTone(report.status)}>
                        {report.status}
                      </StatusBadge>
                    </td>
                    <td className="text-right align-top">
                      <ReportsClient reportId={report.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataTableShell>
    </>
  );
}
