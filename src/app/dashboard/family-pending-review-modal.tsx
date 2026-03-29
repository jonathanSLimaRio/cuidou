"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { DataCard } from "@/components/theme/data-card";
import { ModalShell } from "@/components/theme/modal-shell";
import { ProfessionalSummaryCard } from "@/components/theme/professional-summary-card";
import { ApplicationStatus } from "@prisma/client";
import { Check, Heart, HeartOff, MessageCircleMore, X } from "lucide-react";
import { useMemo, useState } from "react";

type ReviewApplication = {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  coverMessage: string | null;
  isFavoriteByFamily: boolean;
  job: {
    title: string;
    city: string;
    state: string;
  };
  professional: {
    name: string | null;
    email: string | null;
    image: string | null;
    profileId: string | null;
    city: string | null;
    state: string | null;
    verificationStatus: "NOT_SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | null;
    serviceTypes: Array<"BABYSITTER" | "ELDER_CAREGIVER">;
    experienceYears: number | null;
  };
};

type FamilyDashboardKpiSectionProps = {
  jobs: number;
  receivedApplicationsCount: number;
  pendingApplicationsCount: number;
  conversations: number;
  notifications: number;
  contractsInProgress: number;
  contractsCompleted: number;
  initialApplications: ReviewApplication[];
};

type ReviewTab = "pending" | "all";

function canDecide(status: ApplicationStatus) {
  return status === ApplicationStatus.SUBMITTED || status === ApplicationStatus.SHORTLISTED;
}

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
      stateLabel: "Candidatura aceita",
    };
  }

  if (status === ApplicationStatus.REJECTED) {
    return {
      label: status,
      tone: "danger" as const,
      stateLabel: "Candidatura recusada",
    };
  }

  return {
    label: status,
    tone: "neutral" as const,
    stateLabel: "Status atualizado",
  };
}

export function FamilyDashboardKpiSection({
  jobs,
  receivedApplicationsCount,
  pendingApplicationsCount,
  conversations,
  notifications,
  contractsInProgress,
  contractsCompleted,
  initialApplications,
}: FamilyDashboardKpiSectionProps) {
  const { error: showError, success } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<ReviewTab>("pending");
  const [applications, setApplications] = useState(initialApplications);
  const [busyActionById, setBusyActionById] = useState<Record<string, "accept" | "reject" | "favorite" | null>>(
    {},
  );
  const [pendingCount, setPendingCount] = useState(pendingApplicationsCount);

  const filteredApplications = useMemo(() => {
    if (tab === "all") {
      return applications;
    }
    return applications.filter((application) => canDecide(application.status));
  }, [applications, tab]);

  function openPendingTab() {
    setTab("pending");
    setIsOpen(true);
  }

  function openAllTab() {
    setTab("all");
    setIsOpen(true);
  }

  function setBusy(applicationId: string, action: "accept" | "reject" | "favorite" | null) {
    setBusyActionById((current) => ({
      ...current,
      [applicationId]: action,
    }));
  }

  function patchApplication(applicationId: string, patch: Partial<ReviewApplication>) {
    setApplications((current) =>
      current.map((item) => (item.id === applicationId ? { ...item, ...patch } : item)),
    );
  }

  async function acceptApplication(applicationId: string) {
    const target = applications.find((item) => item.id === applicationId);
    const wasPending = target ? canDecide(target.status) : false;
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

      patchApplication(applicationId, {
        status: result.application.status,
      });
      if (wasPending) {
        setPendingCount((current) => Math.max(0, current - 1));
      }
      success("Candidatura aceita.");
    } catch {
      showError("Erro inesperado ao aceitar candidatura.");
    } finally {
      setBusy(applicationId, null);
    }
  }

  async function rejectApplication(applicationId: string) {
    const target = applications.find((item) => item.id === applicationId);
    const wasPending = target ? canDecide(target.status) : false;
    setBusy(applicationId, "reject");

    try {
      const response = await fetch(`/api/applications/${applicationId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          favorite: target?.isFavoriteByFamily ?? false,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        showError("Não foi possível recusar a candidatura.", result.error);
        return;
      }

      patchApplication(applicationId, {
        status: result.application.status,
        isFavoriteByFamily: result.application.isFavoriteByFamily,
      });
      if (wasPending) {
        setPendingCount((current) => Math.max(0, current - 1));
      }
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

      patchApplication(applicationId, {
        isFavoriteByFamily: result.application.isFavoriteByFamily,
      });
    } catch {
      showError("Erro inesperado ao atualizar favorito.");
    } finally {
      setBusy(applicationId, null);
    }
  }

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <DataCard label="Vagas criadas" value={jobs} tone="tint" href="/family#minhas-vagas" />
        <DataCard
          label="Candidaturas recebidas"
          value={receivedApplicationsCount}
          tone="surface"
          onClick={openAllTab}
          ariaLabel="Abrir análise de candidaturas recebidas"
        />
        <DataCard
          label="Pendentes de decisão"
          value={pendingCount}
          tone="surface"
          onClick={openPendingTab}
          ariaLabel="Abrir análise de pendências de candidatura"
        />
        <DataCard label="Conversas" value={conversations} tone="surface" href="/chat" />
        <DataCard label="Notificações não lidas" value={notifications} tone="surface" href="/notifications" />
        <DataCard label="Contratos ativos" value={contractsInProgress} tone="deep" href="/family#gestao-contratos" />
        <DataCard label="Contratos concluídos" value={contractsCompleted} tone="surface" href="/family#gestao-contratos" />
      </section>

      <ModalShell
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Análise rápida de candidaturas"
        description="Avalie pendências sem sair do dashboard. Para gestão completa, use o pipeline da família."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <ActionButton
              type="button"
              size="sm"
              variant={tab === "pending" ? "primary" : "secondary"}
              icon={Check}
              onClick={() => setTab("pending")}
            >
              Pendentes
            </ActionButton>
            <ActionButton
              type="button"
              size="sm"
              variant={tab === "all" ? "primary" : "secondary"}
              icon={MessageCircleMore}
              onClick={() => setTab("all")}
            >
              Todas
            </ActionButton>
          </div>

          {filteredApplications.length === 0 ? (
            <p className="theme-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
              Nenhuma candidatura encontrada neste filtro.
            </p>
          ) : (
            <ul className="space-y-3">
              {filteredApplications.map((application) => {
                const meta = statusMeta(application.status);
                const isBusy = Boolean(busyActionById[application.id]);

                return (
                  <li key={application.id} className="theme-list-card p-4">
                    <h3 className="text-lg text-[var(--theme-navy)]">{application.job.title}</h3>
                    <p className="mt-1 text-xs text-[var(--theme-muted)]">
                      {application.job.city}/{application.job.state}
                    </p>
                    <div className="mt-3">
                      <ProfessionalSummaryCard
                        professional={application.professional}
                        applicationStatusLabel={meta.label}
                        applicationStatusTone={meta.tone}
                        stateLabel={
                          canDecide(application.status)
                            ? `${meta.stateLabel} • ${pendingLabel(application.createdAt)}`
                            : meta.stateLabel
                        }
                        coverMessage={application.coverMessage}
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
                                  onClick={() => rejectApplication(application.id)}
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
                          </>
                        }
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex justify-end">
            <ActionButton href="/family#pipeline-candidaturas" icon={MessageCircleMore} size="sm" variant="secondary">
              Abrir pipeline completo
            </ActionButton>
          </div>
        </div>
      </ModalShell>
    </>
  );
}
