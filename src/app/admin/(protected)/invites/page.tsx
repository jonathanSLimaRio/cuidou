import { DataTableShell } from "@/components/theme/data-table-shell";
import { PageHeader } from "@/components/theme/page-header";
import { StatusBadge } from "@/components/theme/status-badge";
import { prisma } from "@/lib/prisma";
import { InvitesCreation } from "./invites-creation";
import { InvitesCopyAction } from "./invites-copy-action";

export const dynamic = "force-dynamic";

export default async function InvitesPage() {
  const invites = await prisma.adminInvite.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const now = new Date();

  return (
    <>
      <PageHeader
        eyebrow="Acesso"
        title="Convites de Admin"
        description="Emita convites seguros para adicionar novos membros à equipe de backoffice."
      />

      <InvitesCreation />

      <DataTableShell
        title="Histórico de Convites"
        description={`${invites.length} convites emitidos recentemente.`}
      >
        {invites.length === 0 ? (
          <p className="theme-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
            Nenhum convite emitido até o momento.
          </p>
        ) : (
          <div className="theme-table-wrap">
            <table className="theme-table min-w-[820px]">
              <thead>
                <tr>
                  <th>Emitido Em</th>
                  <th>E-mail Destino</th>
                  <th>Status</th>
                  <th>Expira Em</th>
                  <th className="text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => {
                  const isAccepted = invite.acceptedAt !== null;
                  const isExpired = !isAccepted && new Date(invite.expiresAt) < now;
                  const isPending = !isAccepted && !isExpired;

                  let tone: "success" | "warning" | "danger" | "neutral" = "neutral";
                  let statusLabel = "Desconhecido";

                  if (isAccepted) {
                    tone = "success";
                    statusLabel = "ACEITO";
                  } else if (isExpired) {
                    tone = "danger";
                    statusLabel = "EXPIRADO";
                  } else if (isPending) {
                    tone = "warning";
                    statusLabel = "PENDENTE";
                  }

                  return (
                    <tr key={invite.id}>
                      <td className="text-xs text-[var(--theme-muted)]">
                        {new Date(invite.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        <span className="font-medium text-[var(--theme-body)]">
                          {invite.email}
                        </span>
                      </td>
                      <td>
                        <StatusBadge tone={tone}>
                          {statusLabel}
                        </StatusBadge>
                      </td>
                      <td className="text-xs text-[var(--theme-muted)]">
                        {isAccepted ? "—" : new Date(invite.expiresAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="text-right align-middle">
                        {isPending ? (
                          <InvitesCopyAction token={invite.token} />
                        ) : (
                          <span className="text-xs text-[var(--theme-muted)]">—</span>
                        )}
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
