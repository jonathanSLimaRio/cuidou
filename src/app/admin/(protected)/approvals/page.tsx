import { DataTableShell } from "@/components/theme/data-table-shell";
import { PageHeader } from "@/components/theme/page-header";
import { StatusBadge } from "@/components/theme/status-badge";
import { prisma } from "@/lib/prisma";
import { VerificationStatus } from "@prisma/client";
import { ApprovalsClient } from "./approvals-client";

export const dynamic = "force-dynamic";

function verificationTone(status: VerificationStatus) {
  switch (status) {
    case "VERIFIED":
      return "success" as const;
    case "REJECTED":
      return "danger" as const;
    case "UNDER_REVIEW":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

export default async function ApprovalsPage() {
  const documents = await prisma.professionalDocument.findMany({
    where: { status: VerificationStatus.UNDER_REVIEW },
    orderBy: { createdAt: "asc" },
    include: {
      professionalProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Compliance"
        title="Aprovações Pendentes"
        description="Avalie os cadastros e documentos submetidos pelas cuidadoras."
      />

      <DataTableShell
        title="Documentos em Análise"
        description={`${documents.length} documentos aguardando verificação pela equipe de compliance.`}
      >
        {documents.length === 0 ? (
          <p className="theme-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
            Nenhuma aprovação pendente no momento. Bom trabalho!
          </p>
        ) : (
          <div className="theme-table-wrap">
            <table className="theme-table min-w-[820px]">
              <thead>
                <tr>
                  <th>Enviado Em</th>
                  <th>Cuidadora</th>
                  <th>Tipo (Mocked)</th>
                  <th>Status</th>
                  <th className="text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const user = doc.professionalProfile.user;
                  return (
                    <tr key={doc.id}>
                      <td className="text-xs text-[var(--theme-muted)]">
                        {new Date(doc.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span>{user.name ?? "—"}</span>
                          <span className="text-xs text-[var(--theme-muted)]">{user.email ?? "—"}</span>
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] px-2 py-0.5 text-xs text-[var(--theme-body)] uppercase max-w-[150px] truncate">
                          ID: {doc.id.split("-")[0]}
                        </span>
                      </td>
                      <td>
                        <StatusBadge tone={verificationTone(doc.status)}>
                          {doc.status}
                        </StatusBadge>
                      </td>
                      <td className="text-right">
                        <ApprovalsClient documentId={doc.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DataTableShell>
    </>
  );
}
