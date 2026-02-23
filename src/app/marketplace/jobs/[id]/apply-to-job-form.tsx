"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { SendHorizontal } from "lucide-react";
import { FormEvent, useState } from "react";

type Props = {
  jobId: string;
  jobTitle: string;
  familyName: string;
  alreadyApplied: boolean;
  precheckWarning?: string | null;
};

export function ApplyToJobForm({
  jobId,
  jobTitle,
  familyName,
  alreadyApplied,
  precheckWarning,
}: Props) {
  const { error: showError, success } = useToast();
  const [coverMessage, setCoverMessage] = useState(
    "Tenho interesse na vaga e posso compartilhar mais detalhes da minha experiência.",
  );
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
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
        showError("Não foi possível enviar candidatura.", payload.error);
        return;
      }

      success(
        "Candidatura enviada com sucesso.",
        `Enviada para a vaga "${jobTitle}" da família ${familyName}.`,
      );
      if (payload.scheduleMatchWarning?.message) {
        setWarning(payload.scheduleMatchWarning.message);
      }
    } catch {
      showError("Erro inesperado ao enviar candidatura.");
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
      {precheckWarning ? <p className="theme-alert theme-alert-warning">{precheckWarning}</p> : null}
      <textarea
        className="theme-textarea"
        value={coverMessage}
        onChange={(event) => setCoverMessage(event.target.value)}
        minLength={10}
        required
      />

      {warning ? <p className="theme-alert theme-alert-warning">{warning}</p> : null}

      <ActionButton type="submit" icon={SendHorizontal} disabled={loading}>
        {loading ? "Enviando..." : "Enviar candidatura"}
      </ActionButton>
    </form>
  );
}
