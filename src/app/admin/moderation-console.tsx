"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { StatusBadge } from "@/components/theme/status-badge";
import { Check, Plus, Save, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type ModerationDocument = {
  id: string;
  documentType: string;
  status: "NOT_SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  professionalProfile: {
    user: {
      id: string;
      name: string | null;
      email: string | null;
    };
  };
};

type ModerationReport = {
  id: string;
  targetType: string;
  reason: string;
  details: string | null;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  reporter: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

type ModerationJob = {
  id: string;
  title: string;
  status: "OPEN" | "PAUSED" | "CLOSED" | "ARCHIVED";
  isVisible: boolean;
  createdAt: string;
  family: {
    id: string;
    name: string | null;
    email: string | null;
  };
  _count: {
    applications: number;
    reports: number;
  };
};

type AdminInviteItem = {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
};

function documentTone(status: ModerationDocument["status"]) {
  if (status === "VERIFIED") {
    return "success" as const;
  }
  if (status === "REJECTED") {
    return "danger" as const;
  }
  if (status === "UNDER_REVIEW") {
    return "warning" as const;
  }
  return "neutral" as const;
}

function reportTone(status: ModerationReport["status"]) {
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

function jobTone(status: ModerationJob["status"]) {
  if (status === "OPEN") {
    return "success" as const;
  }
  if (status === "PAUSED") {
    return "warning" as const;
  }
  if (status === "CLOSED") {
    return "neutral" as const;
  }
  return "danger" as const;
}

export function ModerationConsole() {
  const { error: showError, success } = useToast();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<ModerationDocument[]>([]);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [jobs, setJobs] = useState<ModerationJob[]>([]);
  const [invites, setInvites] = useState<AdminInviteItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [documentReasonById, setDocumentReasonById] = useState<Record<string, string>>({});
  const [reportNotesById, setReportNotesById] = useState<Record<string, string>>({});
  const [jobDrafts, setJobDrafts] = useState<Record<string, { status: ModerationJob["status"]; isVisible: boolean }>>(
    {},
  );
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteExpiresInDays, setInviteExpiresInDays] = useState(7);

  const pendingDocuments = useMemo(
    () => documents.filter((document) => document.status === "UNDER_REVIEW"),
    [documents],
  );
  const openReports = useMemo(
    () => reports.filter((report) => report.status === "OPEN" || report.status === "IN_REVIEW"),
    [reports],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [documentsResponse, reportsResponse, jobsResponse, invitesResponse] = await Promise.all([
        fetch("/api/admin/moderation/documents", { cache: "no-store" }),
        fetch("/api/admin/moderation/reports", { cache: "no-store" }),
        fetch("/api/admin/moderation/jobs", { cache: "no-store" }),
        fetch("/api/admin/invites", { cache: "no-store" }),
      ]);

      const [documentsPayload, reportsPayload, jobsPayload, invitesPayload] = await Promise.all([
        documentsResponse.json(),
        reportsResponse.json(),
        jobsResponse.json(),
        invitesResponse.json(),
      ]);

      if (!documentsResponse.ok || !reportsResponse.ok || !jobsResponse.ok || !invitesResponse.ok) {
        showError("Falha ao carregar console de moderacao.");
        return;
      }

      const nextDocuments = (documentsPayload.items ?? []) as ModerationDocument[];
      const nextReports = (reportsPayload.items ?? []) as ModerationReport[];
      const nextJobs = (jobsPayload.items ?? []) as ModerationJob[];
      const nextInvites = (invitesPayload.items ?? []) as AdminInviteItem[];

      setDocuments(nextDocuments);
      setReports(nextReports);
      setJobs(nextJobs);
      setInvites(nextInvites);
      setJobDrafts(
        Object.fromEntries(
          nextJobs.map((job) => [job.id, { status: job.status, isVisible: job.isVisible }]),
        ),
      );
    } catch {
      showError("Erro inesperado ao carregar console de moderacao.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function reviewDocument(id: string, action: "APPROVE" | "REJECT") {
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/documents/${id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          reason: documentReasonById[id]?.trim() || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        showError("Falha ao revisar documento.", payload.error);
        return;
      }

      await loadAll();
      success(action === "APPROVE" ? "Documento aprovado." : "Documento rejeitado.");
    } catch {
      showError("Erro inesperado ao revisar documento.");
    } finally {
      setBusyId(null);
    }
  }

  async function resolveReport(id: string, status: "RESOLVED" | "DISMISSED") {
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/reports/${id}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          resolutionNotes: reportNotesById[id]?.trim() || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        showError("Falha ao atualizar denuncia.", payload.error);
        return;
      }

      await loadAll();
      success(status === "RESOLVED" ? "Denuncia resolvida." : "Denuncia descartada.");
    } catch {
      showError("Erro inesperado ao atualizar denuncia.");
    } finally {
      setBusyId(null);
    }
  }

  async function updateJob(id: string) {
    const draft = jobDrafts[id];
    if (!draft) {
      return;
    }

    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/jobs/${id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: draft.status,
          isVisible: draft.isVisible,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        showError("Falha ao atualizar vaga.", payload.error);
        return;
      }

      await loadAll();
      success("Vaga atualizada.");
    } catch {
      showError("Erro inesperado ao atualizar vaga.");
    } finally {
      setBusyId(null);
    }
  }

  async function createInvite() {
    setBusyId("create-invite");
    try {
      const response = await fetch("/api/admin/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          expiresInDays: inviteExpiresInDays,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        showError("Falha ao criar convite admin.", payload.error);
        return;
      }

      setInviteEmail("");
      setInviteExpiresInDays(7);
      await loadAll();
      success("Convite admin criado com sucesso.");
    } catch {
      showError("Erro inesperado ao criar convite admin.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <section className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
        <p className="text-sm text-[var(--theme-muted)]">Carregando console de moderacao...</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <section className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
        <p className="theme-chip theme-chip-pink w-fit">Denuncias</p>
        <h2 className="mt-3 text-3xl">Fila de moderacao de denuncias</h2>
        <p className="mt-2 text-sm text-[var(--theme-body)]">
          {openReports.length} denuncia(s) aberta(s) ou em revisao.
        </p>

        <div className="mt-4 space-y-3">
          {openReports.length === 0 ? (
            <p className="theme-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
              Nenhuma denuncia pendente.
            </p>
          ) : (
            openReports.map((report) => (
              <article key={report.id} className="theme-list-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={reportTone(report.status)}>{report.status}</StatusBadge>
                  <StatusBadge tone="info">{report.targetType}</StatusBadge>
                </div>
                <p className="mt-2 text-sm text-[var(--theme-body)]">
                  <strong>Motivo:</strong> {report.reason}
                </p>
                {report.details ? (
                  <p className="mt-1 text-sm text-[var(--theme-body)]">{report.details}</p>
                ) : null}
                <p className="mt-1 text-xs text-[var(--theme-muted)]">
                  Reporter: {report.reporter.name ?? report.reporter.email ?? "Usuario"} •{" "}
                  {new Date(report.createdAt).toLocaleString("pt-BR")}
                </p>
                <textarea
                  className="theme-textarea mt-3 min-h-20"
                  placeholder="Notas de resolucao (opcional)"
                  value={reportNotesById[report.id] ?? ""}
                  onChange={(event) =>
                    setReportNotesById((current) => ({ ...current, [report.id]: event.target.value }))
                  }
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionButton
                    type="button"
                    size="sm"
                    icon={Check}
                    disabled={busyId === report.id}
                    onClick={() => resolveReport(report.id, "RESOLVED")}
                  >
                    Resolver
                  </ActionButton>
                  <ActionButton
                    type="button"
                    size="sm"
                    variant="secondary"
                    icon={X}
                    disabled={busyId === report.id}
                    onClick={() => resolveReport(report.id, "DISMISSED")}
                  >
                    Descartar
                  </ActionButton>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
        <p className="theme-chip theme-chip-blue w-fit">Documentos</p>
        <h2 className="mt-3 text-3xl">Revisao documental</h2>
        <p className="mt-2 text-sm text-[var(--theme-body)]">
          {pendingDocuments.length} documento(s) aguardando revisao.
        </p>

        <div className="mt-4 space-y-3">
          {pendingDocuments.length === 0 ? (
            <p className="theme-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
              Nenhum documento pendente.
            </p>
          ) : (
            pendingDocuments.map((document) => (
              <article key={document.id} className="theme-list-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={documentTone(document.status)}>{document.status}</StatusBadge>
                  <StatusBadge tone="neutral">{document.documentType}</StatusBadge>
                </div>
                <p className="mt-2 text-sm text-[var(--theme-body)]">
                  Profissional:{" "}
                  {document.professionalProfile.user.name ?? document.professionalProfile.user.email ?? "-"}
                </p>
                <p className="mt-1 text-xs text-[var(--theme-muted)]">
                  Enviado em {new Date(document.createdAt).toLocaleString("pt-BR")}
                </p>
                <textarea
                  className="theme-textarea mt-3 min-h-20"
                  placeholder="Motivo de rejeicao (opcional)"
                  value={documentReasonById[document.id] ?? ""}
                  onChange={(event) =>
                    setDocumentReasonById((current) => ({ ...current, [document.id]: event.target.value }))
                  }
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionButton
                    type="button"
                    size="sm"
                    icon={Check}
                    disabled={busyId === document.id}
                    onClick={() => reviewDocument(document.id, "APPROVE")}
                  >
                    Aprovar
                  </ActionButton>
                  <ActionButton
                    type="button"
                    size="sm"
                    variant="secondary"
                    icon={X}
                    disabled={busyId === document.id}
                    onClick={() => reviewDocument(document.id, "REJECT")}
                  >
                    Rejeitar
                  </ActionButton>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
        <p className="theme-chip theme-chip-indigo w-fit">Vagas</p>
        <h2 className="mt-3 text-3xl">Moderacao de vagas</h2>
        <p className="mt-2 text-sm text-[var(--theme-body)]">Atualize status e visibilidade das vagas.</p>

        <div className="mt-4 space-y-3">
          {jobs.length === 0 ? (
            <p className="theme-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
              Nenhuma vaga encontrada.
            </p>
          ) : (
            jobs.map((job) => {
              const draft = jobDrafts[job.id] ?? { status: job.status, isVisible: job.isVisible };
              return (
                <article key={job.id} className="theme-list-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={jobTone(job.status)}>{job.status}</StatusBadge>
                    <StatusBadge tone="neutral">
                      {job._count.applications} candidatura(s)
                    </StatusBadge>
                    <StatusBadge tone={job.isVisible ? "success" : "danger"}>
                      {job.isVisible ? "Visivel" : "Oculta"}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 text-base text-[var(--theme-navy)]">{job.title}</p>
                  <p className="mt-1 text-xs text-[var(--theme-muted)]">
                    Familia: {job.family.name ?? job.family.email ?? "-"}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3 sm:items-center">
                    <select
                      className="theme-select"
                      value={draft.status}
                      onChange={(event) =>
                        setJobDrafts((current) => ({
                          ...current,
                          [job.id]: {
                            ...draft,
                            status: event.target.value as ModerationJob["status"],
                          },
                        }))
                      }
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="PAUSED">PAUSED</option>
                      <option value="CLOSED">CLOSED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                    <label className="inline-flex items-center gap-2 text-sm text-[var(--theme-body)]">
                      <input
                        type="checkbox"
                        checked={draft.isVisible}
                        onChange={(event) =>
                          setJobDrafts((current) => ({
                            ...current,
                            [job.id]: {
                              ...draft,
                              isVisible: event.target.checked,
                            },
                          }))
                        }
                      />
                      Visivel no marketplace
                    </label>
                    <ActionButton
                      type="button"
                      size="sm"
                      icon={Save}
                      disabled={busyId === job.id}
                      onClick={() => updateJob(job.id)}
                    >
                      Salvar vaga
                    </ActionButton>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
        <p className="theme-chip theme-chip-yellow w-fit">Convites de admin</p>
        <h2 className="mt-3 text-3xl">Criacao e historico de convites</h2>
        <p className="mt-2 text-sm text-[var(--theme-body)]">
          Crie convites para promover novos administradores por token.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">E-mail</span>
            <input
              type="email"
              className="theme-field"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="admin@exemplo.com"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Expira em (dias)</span>
            <input
              type="number"
              min={1}
              max={30}
              className="theme-field"
              value={inviteExpiresInDays}
              onChange={(event) => setInviteExpiresInDays(Number(event.target.value || 7))}
            />
          </label>
          <ActionButton
            type="button"
            icon={Plus}
            disabled={busyId === "create-invite" || inviteEmail.trim().length === 0}
            onClick={createInvite}
          >
            Criar convite
          </ActionButton>
        </div>

        <div className="mt-4 space-y-3">
          {invites.length === 0 ? (
            <p className="theme-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
              Nenhum convite de admin criado.
            </p>
          ) : (
            invites.map((invite) => (
              <article key={invite.id} className="theme-list-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={invite.acceptedAt ? "success" : "warning"}>
                    {invite.acceptedAt ? "Aceito" : "Pendente"}
                  </StatusBadge>
                  <StatusBadge tone="neutral">
                    Expira em {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm text-[var(--theme-body)]">{invite.email}</p>
                <p className="mt-1 text-xs text-[var(--theme-muted)]">Token: {invite.token}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
