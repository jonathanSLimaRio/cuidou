"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { Flag, X } from "lucide-react";
import { useState } from "react";

type ReportTargetType = "USER" | "JOB" | "MESSAGE" | "PROFESSIONAL_PROFILE" | "CONVERSATION";

type Props = {
  targetType: ReportTargetType;
  targetUserId?: string;
  targetJobId?: string;
  targetMessageId?: string;
  targetProfessionalProfileId?: string;
  targetConversationId?: string;
  buttonLabel?: string;
};

export function ReportAction({
  targetType,
  targetUserId,
  targetJobId,
  targetMessageId,
  targetProfessionalProfileId,
  targetConversationId,
  buttonLabel = "Denunciar",
}: Props) {
  const { error: showError, success, warning } = useToast();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 5) {
      warning("Motivo invalido", "Informe um motivo com pelo menos 5 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetType,
          reason: normalizedReason,
          details: details.trim() || undefined,
          targetUserId,
          targetJobId,
          targetMessageId,
          targetProfessionalProfileId,
          targetConversationId,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        showError("Falha ao enviar denuncia.", payload.error);
        return;
      }

      setReason("");
      setDetails("");
      setOpen(false);
      success("Denuncia enviada com sucesso.");
    } catch {
      showError("Erro inesperado ao enviar denuncia.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <ActionButton type="button" size="sm" variant="secondary" icon={Flag} onClick={() => setOpen((v) => !v)}>
        {buttonLabel}
      </ActionButton>

      {open ? (
        <div className="space-y-2 rounded-2xl border border-[var(--theme-border)] bg-white p-3">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Motivo</span>
            <input
              className="theme-field"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              minLength={5}
              maxLength={240}
              placeholder="Descreva resumidamente o motivo da denuncia"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Detalhes</span>
            <textarea
              className="theme-textarea min-h-24"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              maxLength={1500}
              placeholder="Informacoes adicionais (opcional)"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <ActionButton type="button" size="sm" icon={Flag} disabled={loading} onClick={submit}>
              {loading ? "Enviando..." : "Enviar denuncia"}
            </ActionButton>
            <ActionButton type="button" size="sm" variant="soft" icon={X} onClick={() => setOpen(false)}>
              Cancelar
            </ActionButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
