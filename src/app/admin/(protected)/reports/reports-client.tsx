"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { BookOpenCheck, ShieldBan } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ReportsClientProps = {
  reportId: string;
};

export function ReportsClient({ reportId }: ReportsClientProps) {
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState<"RESOLVED" | "DISMISSED" | null>(null);
  const router = useRouter();
  const { success, error } = useToast();

  async function handleAction(status: "RESOLVED" | "DISMISSED") {
    if (!showForm || showForm !== status) {
      setShowForm(status);
      return;
    }
    
    if (!notes.trim()) {
      error("Notas de painel insuficientes. Informe sua avaliação policial e conclusões.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, resolutionNotes: notes.trim() }),
      });

      const payload = await response.json();
      if (!response.ok) {
        error("Falha ao atualizar denúncia.", payload.error);
        return;
      }

      success(status === "RESOLVED" ? "Denúncia mitigada e resolvida." : "Denúncia sumariamente descartada.");
      setShowForm(null);
      router.refresh();
    } catch {
      error("Falha na interceptação de denúncias via API.");
    } finally {
      setBusy(false);
    }
  }

  if (showForm) {
    const isResolve = showForm === "RESOLVED";
    return (
      <div className="flex flex-col items-end gap-2 text-left">
        <textarea
          className="theme-field py-1 text-xs w-56 h-16 resize-none"
          placeholder="Apontamentos e deliberações do backoffice..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={busy}
          autoFocus
        />
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowForm(null)}
            className="text-xs px-2 py-1 text-[var(--theme-muted)] hover:text-[var(--theme-body)]"
            disabled={busy}
          >
            Cancelar
          </button>
          <ActionButton
            variant={isResolve ? "primary" : "secondary"}
            size="sm"
            icon={isResolve ? BookOpenCheck : ShieldBan}
            onClick={() => void handleAction(showForm)}
            disabled={busy}
          >
            {isResolve ? "Concluir Moderação" : "Descartar Protocolo"}
          </ActionButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 items-end">
      <ActionButton
        variant="primary"
        size="sm"
        icon={BookOpenCheck}
        className="w-full justify-start text-xs"
        onClick={() => void handleAction("RESOLVED")}
        disabled={busy}
      >
        Resolver
      </ActionButton>
      <ActionButton
        variant="secondary"
        size="sm"
        icon={ShieldBan}
        className="w-full justify-start text-xs opacity-80"
        onClick={() => void handleAction("DISMISSED")}
        disabled={busy}
      >
        Descartar
      </ActionButton>
    </div>
  );
}
