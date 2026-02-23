"use client";

import { ActionButton } from "@/components/theme/action-button";
import { StatusBadge } from "@/components/theme/status-badge";
import { invitationStatusLabel, invitationStatusTone } from "@/lib/invitation-ui";
import { JobInvitationStatus } from "@prisma/client";
import { Ban, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";

type InvitationItem = {
  id: string;
  status: JobInvitationStatus;
  message: string | null;
  responseMessage: string | null;
  expiresAt: string;
  respondedAt: string | null;
  createdAt: string;
  professional: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

type JobInvitationGroup = {
  jobId: string;
  jobTitle: string;
  items: InvitationItem[];
};

type Props = {
  initialGroups: JobInvitationGroup[];
};

export function InvitationsPanel({ initialGroups }: Props) {
  const [groups, setGroups] = useState(initialGroups);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(
    () => groups.reduce((acc, group) => acc + group.items.length, 0),
    [groups],
  );

  async function cancelInvitation(invitationId: string) {
    setBusyId(invitationId);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/${invitationId}/cancel`, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Não foi possível cancelar o convite.");
        return;
      }

      setGroups((current) =>
        current.map((group) => ({
          ...group,
          items: group.items.map((item) =>
            item.id === invitationId
              ? {
                  ...item,
                  status: result.invitation.status,
                  respondedAt: result.invitation.respondedAt,
                }
              : item,
          ),
        })),
      );
    } catch {
      setError("Erro inesperado ao cancelar convite.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="theme-card rounded-[34px] px-6 py-8 sm:px-8">
      <p className="theme-chip theme-chip-pink w-fit">Convites para candidatura</p>
      <h2 className="mt-3 text-3xl">Convites enviados</h2>
      <p className="mt-2 text-sm text-[var(--theme-body)]">
        Total de convites registrados: {total}. Acompanhe aceite, recusa e expirados por vaga.
      </p>

      {error ? <p className="theme-alert theme-alert-danger mt-4">{error}</p> : null}

      {groups.length === 0 ? (
        <p className="theme-card-soft mt-5 rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
          Nenhum convite enviado ainda.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {groups.map((group) => (
            <article key={group.jobId} className="theme-list-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl leading-tight text-[var(--theme-navy)]">{group.jobTitle}</h3>
                <StatusBadge tone="neutral">{group.items.length} convite(s)</StatusBadge>
              </div>

              <ul className="mt-3 space-y-2">
                {group.items.map((invitation) => (
                  <li key={invitation.id} className="rounded-2xl border border-[var(--theme-border)] bg-white px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--theme-navy)]">
                        {invitation.professional.name ?? invitation.professional.email ?? "Profissional"}
                      </p>
                      <StatusBadge tone={invitationStatusTone(invitation.status)}>
                        {invitationStatusLabel[invitation.status]}
                      </StatusBadge>
                    </div>

                    <p className="mt-1 text-xs text-[var(--theme-muted)]">
                      Enviado em {new Date(invitation.createdAt).toLocaleDateString("pt-BR")} • Expira em{" "}
                      {new Date(invitation.expiresAt).toLocaleDateString("pt-BR")}
                    </p>

                    {invitation.message ? (
                      <p className="mt-2 text-sm text-[var(--theme-body)]">Mensagem: {invitation.message}</p>
                    ) : null}

                    {invitation.responseMessage ? (
                      <p className="mt-2 text-sm text-[var(--theme-body)]">
                        Resposta: {invitation.responseMessage}
                      </p>
                    ) : null}

                    {invitation.status === JobInvitationStatus.PENDING ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <ActionButton
                          type="button"
                          icon={Ban}
                          size="sm"
                          variant="secondary"
                          disabled={busyId === invitation.id}
                          onClick={() => cancelInvitation(invitation.id)}
                        >
                          Cancelar convite
                        </ActionButton>
                        <StatusBadge tone="warning" hideIcon>
                          <Clock3 size={14} /> Aguardando resposta
                        </StatusBadge>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
