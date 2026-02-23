"use client";

import { ActionButton } from "@/components/theme/action-button";
import { CtaButton } from "@/components/theme/cta-button";
import { Send, UserRoundPlus } from "lucide-react";
import { useState } from "react";

type FamilyOpenJob = {
  id: string;
  title: string;
  city: string;
  state: string;
  applicationsCount: number;
};

type Props = {
  professionalId: string;
  jobs: FamilyOpenJob[];
};

export function InviteToJobForm({ professionalId, jobs }: Props) {
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id ?? "");
  const [message, setMessage] = useState("Gostaria de convidar você para se candidatar à vaga.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  async function submit() {
    if (!selectedJobId) {
      setError("Selecione uma vaga para enviar o convite.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setWarning(null);

    try {
      const response = await fetch(`/api/jobs/${selectedJobId}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          professionalId,
          message: message.trim() || undefined,
          expiresInDays: 7,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Não foi possível enviar convite.");
        return;
      }

      setSuccess("Convite enviado com sucesso. O profissional verá isso na área dele.");
      if (result.scheduleMatchWarning?.message) {
        setWarning(result.scheduleMatchWarning.message);
      }
    } catch {
      setError("Erro inesperado ao enviar convite.");
    } finally {
      setLoading(false);
    }
  }

  if (jobs.length === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-[var(--theme-border)] bg-white p-4">
        <p className="text-sm text-[var(--theme-body)]">
          Você precisa ter ao menos uma vaga aberta para enviar convites.
        </p>
        <CtaButton href="/family" variant="outline" icon={UserRoundPlus}>
          Criar vaga na área da família
        </CtaButton>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--theme-border)] bg-white p-4">
      <p className="text-sm text-[var(--theme-body)]">
        Convide este profissional para se candidatar a uma das suas vagas abertas.
      </p>

      <label className="space-y-1">
        <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Selecionar vaga</span>
        <select
          className="theme-select"
          value={selectedJobId}
          onChange={(event) => setSelectedJobId(event.target.value)}
          disabled={loading}
        >
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title} ({job.city}/{job.state}) - {job.applicationsCount} candidatura(s)
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1">
        <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Mensagem opcional</span>
        <textarea
          className="theme-textarea min-h-24"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={1200}
          disabled={loading}
        />
      </label>

      {error ? <p className="theme-alert theme-alert-danger">{error}</p> : null}
      {warning ? <p className="theme-alert theme-alert-warning">{warning}</p> : null}
      {success ? <p className="theme-alert theme-alert-success">{success}</p> : null}

      <ActionButton type="button" icon={Send} onClick={submit} disabled={loading}>
        {loading ? "Enviando..." : "Convidar para vaga"}
      </ActionButton>
    </div>
  );
}
