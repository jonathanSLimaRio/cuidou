"use client";

import { ActionButton } from "@/components/theme/action-button";
import { SendHorizontal } from "lucide-react";
import { FormEvent, useState } from "react";

type Props = {
  jobId: string;
  alreadyApplied: boolean;
};

export function ApplyToJobForm({ jobId, alreadyApplied }: Props) {
  const [coverMessage, setCoverMessage] = useState(
    "Tenho interesse na vaga e posso compartilhar mais detalhes da minha experiência.",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setWarning(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coverMessage: coverMessage.trim(),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Não foi possível enviar candidatura.");
        return;
      }

      setSuccess("Candidatura enviada com sucesso.");
      if (payload.scheduleMatchWarning?.message) {
        setWarning(payload.scheduleMatchWarning.message);
      }
    } catch {
      setError("Erro inesperado ao enviar candidatura.");
    } finally {
      setLoading(false);
    }
  }

  if (alreadyApplied) {
    return (
      <div className="theme-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--theme-body)]">
        Você já se candidatou para esta vaga.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-[var(--theme-border)] bg-white p-4">
      <p className="text-sm text-[var(--theme-body)]">
        Envie uma mensagem inicial para se candidatar.
      </p>
      <textarea
        className="theme-textarea"
        value={coverMessage}
        onChange={(event) => setCoverMessage(event.target.value)}
        minLength={10}
        required
      />

      {error ? <p className="theme-alert theme-alert-danger">{error}</p> : null}
      {warning ? <p className="theme-alert theme-alert-warning">{warning}</p> : null}
      {success ? <p className="theme-alert theme-alert-success">{success}</p> : null}

      <ActionButton type="submit" icon={SendHorizontal} disabled={loading}>
        {loading ? "Enviando..." : "Enviar candidatura"}
      </ActionButton>
    </form>
  );
}
