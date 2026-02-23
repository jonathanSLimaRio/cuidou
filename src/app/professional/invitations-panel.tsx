"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { OpportunityStateCard } from "@/components/theme/opportunity-state-card";
import { StatusBadge } from "@/components/theme/status-badge";
import { invitationStatusLabel, invitationStatusTone } from "@/lib/invitation-ui";
import { ScheduleMatchLevel } from "@/lib/job-schedule";
import { JobInvitationStatus } from "@prisma/client";
import { Check, CircleAlert, X } from "lucide-react";
import { useState } from "react";

type InvitationItem = {
  id: string;
  status: JobInvitationStatus;
  message: string | null;
  responseMessage: string | null;
  expiresAt: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    city: string;
    state: string;
    serviceType: "BABYSITTER" | "ELDER_CAREGIVER";
    status: "OPEN" | "PAUSED" | "CLOSED" | "ARCHIVED";
  };
  scheduleSummary: Array<{
    weekday: string;
    label: string;
    ranges: string[];
  }>;
  compatibility: {
    level: ScheduleMatchLevel;
    label: string;
    description: string;
  };
  family: {
    id: string;
    name: string | null;
  };
};

type Props = {
  initialInvitations: InvitationItem[];
};

const defaultCoverMessage =
  "Tenho interesse na vaga e confirmo disponibilidade para avançar no processo.";

export function ProfessionalInvitationsPanel({ initialInvitations }: Props) {
  const { error: showError, success, warning } = useToast();
  const [invitations, setInvitations] = useState(initialInvitations);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [coverMessages, setCoverMessages] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialInvitations.map((item) => [item.id, defaultCoverMessage])),
  );
  const [declineReasonById, setDeclineReasonById] = useState<Record<string, string>>({});

  function updateInvitation(invitationId: string, patch: Partial<InvitationItem>) {
    setInvitations((current) =>
      current.map((item) => (item.id === invitationId ? { ...item, ...patch } : item)),
    );
  }

  async function accept(invitationId: string) {
    const coverMessage = coverMessages[invitationId]?.trim();
    if (!coverMessage || coverMessage.length < 10) {
      warning("Mensagem obrigatória", "Escreva uma mensagem de candidatura com pelo menos 10 caracteres.");
      return;
    }

    setBusyId(invitationId);

    try {
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coverMessage,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        showError("Não foi possível aceitar convite.", result.error);
        return;
      }

      updateInvitation(invitationId, {
        status: result.invitation.status,
        responseMessage: result.invitation.responseMessage,
      });
      success("Candidatura enviada com sucesso.", "Aguardando decisão da família.");
    } catch {
      showError("Erro inesperado ao aceitar convite.");
    } finally {
      setBusyId(null);
    }
  }

  async function decline(invitationId: string) {
    const reason = declineReasonById[invitationId]?.trim();
    setBusyId(invitationId);

    try {
      const response = await fetch(`/api/invitations/${invitationId}/decline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: reason || undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        showError("Não foi possível recusar convite.", result.error);
        return;
      }

      updateInvitation(invitationId, {
          status: result.invitation.status,
          responseMessage: result.invitation.responseMessage,
      });
      success("Convite recusado.");
    } catch {
      showError("Erro inesperado ao recusar convite.");
    } finally {
      setBusyId(null);
    }
  }

  function compatibilityTone(level: ScheduleMatchLevel) {
    if (level === "HIGH") {
      return "success" as const;
    }

    if (level === "PARTIAL") {
      return "warning" as const;
    }

    if (level === "LOW") {
      return "danger" as const;
    }

    return "neutral" as const;
  }

  return (
    <section className="theme-card rounded-[34px] px-6 py-8 sm:px-8">
      <p className="theme-chip theme-chip-yellow w-fit">Convites recebidos</p>
      <h2 className="mt-3 text-3xl">Responder convites</h2>
      <p className="mt-2 text-sm text-[var(--theme-body)]">
        Ao aceitar, uma candidatura será criada automaticamente com sua mensagem.
      </p>

      {invitations.length === 0 ? (
        <p className="theme-card-soft mt-5 rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
          Nenhum convite recebido no momento.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {invitations.map((invitation) => (
            <li key={invitation.id} className="theme-list-card p-5">
              {(() => {
                const stateLabel =
                  invitation.status === JobInvitationStatus.PENDING
                    ? `Convite pendente de resposta • Expira em ${new Date(invitation.expiresAt).toLocaleDateString("pt-BR")}`
                    : invitation.status === JobInvitationStatus.ACCEPTED
                      ? "Candidatura enviada via convite"
                      : invitation.status === JobInvitationStatus.DECLINED
                        ? "Convite recusado"
                        : invitation.status === JobInvitationStatus.EXPIRED
                          ? "Convite expirado"
                          : "Convite cancelado";

                return (
              <OpportunityStateCard
                title={invitation.job.title}
                subtitle={`Família: ${invitation.family.name ?? "Família"} • ${invitation.job.city}/${invitation.job.state}`}
                statusLabel={invitationStatusLabel[invitation.status]}
                statusTone={invitationStatusTone(invitation.status)}
                stateLabel={stateLabel}
                details={
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={compatibilityTone(invitation.compatibility.level)}>
                        {invitation.compatibility.label}
                      </StatusBadge>
                      <StatusBadge tone="neutral">
                        Enviado em {new Date(invitation.createdAt).toLocaleDateString("pt-BR")}
                      </StatusBadge>
                    </div>
                    <p className="text-xs text-[var(--theme-muted)]">{invitation.compatibility.description}</p>
                    {invitation.scheduleSummary.length > 0 ? (
                      <p className="text-xs text-[var(--theme-muted)]">
                        Agenda da vaga:{" "}
                        {invitation.scheduleSummary
                          .map((item) => `${item.label} (${item.ranges.join(", ")})`)
                          .join(" • ")}
                      </p>
                    ) : null}
                    {invitation.message ? (
                      <p className="text-sm text-[var(--theme-body)]">Mensagem da família: {invitation.message}</p>
                    ) : null}
                    {invitation.responseMessage ? (
                      <p className="text-sm text-[var(--theme-body)]">Resposta: {invitation.responseMessage}</p>
                    ) : null}
                  </div>
                }
              />
                );
              })()}

              {invitation.status === JobInvitationStatus.PENDING ? (
                <div className="mt-3 space-y-3">
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">
                      Mensagem de candidatura (obrigatória no aceite)
                    </span>
                    <textarea
                      className="theme-textarea min-h-24"
                      value={coverMessages[invitation.id] ?? defaultCoverMessage}
                      onChange={(event) =>
                        setCoverMessages((current) => ({
                          ...current,
                          [invitation.id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">
                      Motivo da recusa (opcional)
                    </span>
                    <textarea
                      className="theme-textarea min-h-20"
                      placeholder="Se quiser, explique por que está recusando."
                      value={declineReasonById[invitation.id] ?? ""}
                      onChange={(event) =>
                        setDeclineReasonById((current) => ({
                          ...current,
                          [invitation.id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton
                      type="button"
                      icon={Check}
                      size="sm"
                      disabled={busyId === invitation.id}
                      onClick={() => accept(invitation.id)}
                    >
                      Aceitar e candidatar
                    </ActionButton>
                    <ActionButton
                      type="button"
                      icon={X}
                      size="sm"
                      variant="secondary"
                      disabled={busyId === invitation.id}
                      onClick={() => decline(invitation.id)}
                    >
                      Recusar
                    </ActionButton>
                  </div>
                </div>
              ) : invitation.status === JobInvitationStatus.ACCEPTED ? (
                <p className="theme-alert theme-alert-success mt-3">
                  Candidatura enviada via convite. Aguardando decisão da família.
                </p>
              ) : invitation.status === JobInvitationStatus.DECLINED ? (
                <p className="theme-alert theme-alert-warning mt-3 inline-flex items-center gap-2">
                  <CircleAlert size={16} />
                  Convite recusado.
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
