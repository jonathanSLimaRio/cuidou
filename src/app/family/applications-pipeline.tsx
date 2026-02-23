"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { OpportunityStateCard } from "@/components/theme/opportunity-state-card";
import { StatusBadge } from "@/components/theme/status-badge";
import { ApplicationStatus } from "@prisma/client";
import { Check, Heart, HeartOff, UserRoundSearch, X } from "lucide-react";
import { useMemo, useState } from "react";

type PipelineApplication = {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  coverMessage: string | null;
  isFavoriteByFamily: boolean;
  fromInvitation: boolean;
  professional: {
    id: string;
    name: string | null;
    email: string | null;
    profileId: string | null;
  };
};

type JobApplicationsGroup = {
  jobId: string;
  jobTitle: string;
  city: string;
  state: string;
  applications: PipelineApplication[];
};

type Props = {
  initialGroups: JobApplicationsGroup[];
};

function pendingLabel(createdAtIso: string) {
  const createdAt = new Date(createdAtIso);
  const diffMs = Date.now() - createdAt.getTime();
  const days = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  return `Pendente há ${days} dia${days > 1 ? "s" : ""}`;
}

function statusMeta(status: ApplicationStatus) {
  if (status === ApplicationStatus.SUBMITTED || status === ApplicationStatus.SHORTLISTED) {
    return {
      label: status,
      tone: "warning" as const,
      stateLabel: "Pendente decisão da família",
    };
  }

  if (status === ApplicationStatus.ACCEPTED) {
    return {
      label: status,
      tone: "success" as const,
      stateLabel: "Contrato em andamento ou finalizado conforme fluxo da vaga",
    };
  }

  if (status === ApplicationStatus.REJECTED) {
    return {
      label: status,
      tone: "danger" as const,
      stateLabel: "Candidatura encerrada",
    };
  }

  return {
    label: status,
    tone: "neutral" as const,
    stateLabel: "Status atualizado",
  };
}

function canDecide(status: ApplicationStatus) {
  return status === ApplicationStatus.SUBMITTED || status === ApplicationStatus.SHORTLISTED;
}

export function ApplicationsPipeline({ initialGroups }: Props) {
  const { error: showError, success } = useToast();
  const [groups, setGroups] = useState(initialGroups);
  const [busyActionById, setBusyActionById] = useState<Record<string, "accept" | "reject" | "favorite" | null>>(
    {},
  );

  const totalApplications = useMemo(
    () => groups.reduce((acc, group) => acc + group.applications.length, 0),
    [groups],
  );

  const totalPending = useMemo(
    () =>
      groups.reduce(
        (acc, group) =>
          acc +
          group.applications.filter(
            (item) => item.status === ApplicationStatus.SUBMITTED || item.status === ApplicationStatus.SHORTLISTED,
          ).length,
        0,
      ),
    [groups],
  );

  function setApplicationPatch(applicationId: string, patch: Partial<PipelineApplication>) {
    setGroups((current) =>
      current.map((group) => ({
        ...group,
        applications: group.applications.map((application) =>
          application.id === applicationId ? { ...application, ...patch } : application,
        ),
      })),
    );
  }

  function setBusy(applicationId: string, action: "accept" | "reject" | "favorite" | null) {
    setBusyActionById((current) => ({
      ...current,
      [applicationId]: action,
    }));
  }

  async function acceptApplication(applicationId: string) {
    setBusy(applicationId, "accept");

    try {
      const response = await fetch(`/api/applications/${applicationId}/accept`, {
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok) {
        showError("Não foi possível aceitar a candidatura.", result.error);
        return;
      }

      setApplicationPatch(applicationId, {
        status: result.application.status,
      });
      success("Candidatura aceita.");
    } catch {
      showError("Erro inesperado ao aceitar candidatura.");
    } finally {
      setBusy(applicationId, null);
    }
  }

  async function rejectApplication(applicationId: string, favorite: boolean) {
    setBusy(applicationId, "reject");

    try {
      const response = await fetch(`/api/applications/${applicationId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ favorite }),
      });
      const result = await response.json();

      if (!response.ok) {
        showError("Não foi possível recusar a candidatura.", result.error);
        return;
      }

      setApplicationPatch(applicationId, {
        status: result.application.status,
        isFavoriteByFamily: result.application.isFavoriteByFamily,
      });
      success("Candidatura recusada.");
    } catch {
      showError("Erro inesperado ao recusar candidatura.");
    } finally {
      setBusy(applicationId, null);
    }
  }

  async function toggleFavorite(applicationId: string, favorite: boolean) {
    setBusy(applicationId, "favorite");

    try {
      const response = await fetch(`/api/applications/${applicationId}/favorite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ favorite }),
      });
      const result = await response.json();

      if (!response.ok) {
        showError("Não foi possível atualizar favorito.", result.error);
        return;
      }

      setApplicationPatch(applicationId, {
        isFavoriteByFamily: result.application.isFavoriteByFamily,
      });
    } catch {
      showError("Erro inesperado ao atualizar favorito.");
    } finally {
      setBusy(applicationId, null);
    }
  }

  return (
    <section id="pipeline-candidaturas" className="theme-card rounded-[34px] px-6 py-8 sm:px-8">
      <p className="theme-chip theme-chip-indigo w-fit">Pipeline de candidaturas</p>
      <h2 className="mt-3 text-3xl">Decisão da família</h2>
      <p className="mt-2 text-sm text-[var(--theme-body)]">
        {totalApplications} candidatura(s) no total • {totalPending} pendente(s) de decisão.
      </p>

      {groups.length === 0 ? (
        <p className="theme-card-soft mt-5 rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
          Nenhuma candidatura recebida ainda.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {groups.map((group) => (
            <article key={group.jobId} className="theme-list-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl leading-tight text-[var(--theme-navy)]">{group.jobTitle}</h3>
                <StatusBadge tone="blue">
                  {group.city}/{group.state}
                </StatusBadge>
              </div>

              <ul className="mt-3 space-y-3">
                {group.applications.map((application) => {
                  const meta = statusMeta(application.status);
                  const isBusy = Boolean(busyActionById[application.id]);

                  return (
                    <li key={application.id}>
                      <OpportunityStateCard
                        title={application.professional.name ?? application.professional.email ?? "Profissional"}
                        subtitle={application.fromInvitation ? "Candidatura enviada via convite" : "Candidatura direta"}
                        statusLabel={meta.label}
                        statusTone={meta.tone}
                        stateLabel={
                          canDecide(application.status)
                            ? `${meta.stateLabel} • ${pendingLabel(application.createdAt)}`
                            : meta.stateLabel
                        }
                        details={application.coverMessage ? <>Mensagem: {application.coverMessage}</> : "Sem mensagem inicial."}
                        actions={
                          <>
                            {canDecide(application.status) ? (
                              <>
                                <ActionButton
                                  type="button"
                                  size="sm"
                                  icon={Check}
                                  disabled={isBusy}
                                  onClick={() => acceptApplication(application.id)}
                                >
                                  Aceitar
                                </ActionButton>
                                <ActionButton
                                  type="button"
                                  size="sm"
                                  icon={X}
                                  variant="secondary"
                                  disabled={isBusy}
                                  onClick={() => rejectApplication(application.id, application.isFavoriteByFamily)}
                                >
                                  Recusar
                                </ActionButton>
                              </>
                            ) : null}
                            <ActionButton
                              type="button"
                              size="sm"
                              icon={application.isFavoriteByFamily ? HeartOff : Heart}
                              variant="soft"
                              disabled={isBusy}
                              onClick={() => toggleFavorite(application.id, !application.isFavoriteByFamily)}
                            >
                              {application.isFavoriteByFamily ? "Desfavoritar" : "Favoritar"}
                            </ActionButton>
                            {application.professional.profileId ? (
                              <ActionButton
                                href={`/marketplace/professionals/${application.professional.profileId}`}
                                size="sm"
                                variant="secondary"
                                icon={UserRoundSearch}
                              >
                                Ver perfil
                              </ActionButton>
                            ) : null}
                          </>
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
