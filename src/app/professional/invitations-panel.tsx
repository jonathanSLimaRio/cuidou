"use client";

import { ActionButton } from "@/components/theme/action-button";
import { StatusBadge } from "@/components/theme/status-badge";
import { invitationStatusLabel, invitationStatusTone } from "@/lib/invitation-ui";
import { JobInvitationStatus } from "@prisma/client";
import { Check, X } from "lucide-react";
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
  const [invitations, setInvitations] = useState(initialInvitations);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coverMessages, setCoverMessages] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialInvitations.map((item) => [item.id, defaultCoverMessage])),
  );

  function updateInvitation(invitationId: string, patch: Partial<InvitationItem>) {
    setInvitations((current) =>
      current.map((item) => (item.id === invitationId ? { ...item, ...patch } : item)),
    );
  }

  async function accept(invitationId: string) {
    const coverMessage = coverMessages[invitationId]?.trim();
    if (!coverMessage || coverMessage.length < 10) {
      setError("Escreva uma mensagem de candidatura com pelo menos 10 caracteres.");
      return;
    }

    setBusyId(invitationId);
    setError(null);

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
        setError(result.error ?? "Não foi possível aceitar convite.");
        return;
      }

      updateInvitation(invitationId, {
        status: result.invitation.status,
        responseMessage: result.invitation.responseMessage,
      });
    } catch {
      setError("Erro inesperado ao aceitar convite.");
    } finally {
      setBusyId(null);
    }
  }

  async function decline(invitationId: string) {
    const reason = window.prompt("Motivo da recusa (opcional):")?.trim();

    setBusyId(invitationId);
    setError(null);

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
        setError(result.error ?? "Não foi possível recusar convite.");
        return;
      }

      updateInvitation(invitationId, {
        status: result.invitation.status,
        responseMessage: result.invitation.responseMessage,
      });
    } catch {
      setError("Erro inesperado ao recusar convite.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="theme-card rounded-[34px] px-6 py-8 sm:px-8">
      <p className="theme-chip theme-chip-yellow w-fit">Convites recebidos</p>
      <h2 className="mt-3 text-3xl">Responder convites</h2>
      <p className="mt-2 text-sm text-[var(--theme-body)]">
        Ao aceitar, uma candidatura será criada automaticamente com sua mensagem.
      </p>

      {error ? <p className="theme-alert theme-alert-danger mt-4">{error}</p> : null}

      {invitations.length === 0 ? (
        <p className="theme-card-soft mt-5 rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
          Nenhum convite recebido no momento.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {invitations.map((invitation) => (
            <li key={invitation.id} className="theme-list-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-xl leading-tight text-[var(--theme-navy)]">{invitation.job.title}</h3>
                  <p className="mt-1 text-xs text-[var(--theme-muted)]">
                    Família: {invitation.family.name ?? "Família"} • {invitation.job.city}/
                    {invitation.job.state}
                  </p>
                </div>
                <StatusBadge tone={invitationStatusTone(invitation.status)}>
                  {invitationStatusLabel[invitation.status]}
                </StatusBadge>
              </div>

              <p className="mt-2 text-xs text-[var(--theme-muted)]">
                Enviado em {new Date(invitation.createdAt).toLocaleDateString("pt-BR")} • Expira em{" "}
                {new Date(invitation.expiresAt).toLocaleDateString("pt-BR")}
              </p>

              {invitation.message ? (
                <p className="mt-2 text-sm text-[var(--theme-body)]">Mensagem da família: {invitation.message}</p>
              ) : null}

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
              ) : invitation.responseMessage ? (
                <p className="mt-2 text-sm text-[var(--theme-body)]">Resposta: {invitation.responseMessage}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
