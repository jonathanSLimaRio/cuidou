"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ApprovalsClientProps = {
  documentId: string;
};

export function ApprovalsClient({ documentId }: ApprovalsClientProps) {
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();

  async function handleAction(action: "APPROVE" | "REJECT") {
    if (action === "REJECT" && !showRejectForm) {
      setShowRejectForm(true);
      return;
    }
    
    if (action === "REJECT" && !reason.trim()) {
      error("Informe o motivo da rejeição.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/admin/documents/${documentId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, reason: reason.trim() || undefined }),
      });

      const payload = await response.json();
      if (!response.ok) {
        error("Falha ao revisar documento.", payload.error);
        return;
      }

      success(action === "APPROVE" ? "Documento aprovado." : "Documento rejeitado.");
      setShowRejectForm(false);
      router.refresh();
    } catch {
      error("Erro inesperado ao revisar documento.");
    } finally {
      setBusy(false);
    }
  }

  if (showRejectForm) {
    return (
      <div className="flex flex-col items-end gap-2">
        <input
          type="text"
          className="theme-field py-1 text-xs w-48 h-8"
          placeholder="Motivo da rejeição..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={busy}
          autoFocus
        />
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowRejectForm(false)}
            className="text-xs px-2 py-1 text-[var(--theme-muted)] hover:text-white"
            disabled={busy}
          >
            Cancelar
          </button>
          <ActionButton
            variant="secondary"
            size="sm"
            icon={X}
            onClick={() => void handleAction("REJECT")}
            disabled={busy}
          >
            Rejeitar
          </ActionButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-1.5">
      <ActionButton
        variant="primary"
        size="sm"
        icon={Check}
        onClick={() => void handleAction("APPROVE")}
        disabled={busy}
      >
        Aprovar
      </ActionButton>
      <ActionButton
        variant="secondary"
        size="sm"
        icon={X}
        onClick={() => void handleAction("REJECT")}
        disabled={busy}
      >
        Rejeitar
      </ActionButton>
    </div>
  );
}
