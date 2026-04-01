"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteJobButtonProps = {
  jobId: string;
  jobTitle: string;
};

export function DeleteJobButton({ jobId, jobTitle }: DeleteJobButtonProps) {
  const { error: showError, success } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Excluir a vaga "${jobTitle}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      const result = await response.json();

      if (!response.ok) {
        showError("Não foi possível excluir a vaga.", result.error);
        return;
      }

      success("Vaga excluída.");
      router.refresh();
    } catch {
      showError("Erro inesperado ao excluir a vaga.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ActionButton
      type="button"
      size="sm"
      icon={Trash2}
      variant="secondary"
      disabled={busy}
      onClick={handleDelete}
      className="disabled:opacity-60"
    >
      Excluir
    </ActionButton>
  );
}

type ReopenJobButtonProps = {
  jobId: string;
};

export function ReopenJobButton({ jobId }: ReopenJobButtonProps) {
  const { error: showError, success } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleReopen() {
    setBusy(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OPEN" }),
      });
      const result = await response.json();

      if (!response.ok) {
        showError("Não foi possível reabrir a vaga.", result.error);
        return;
      }

      success("Vaga reaberta.");
      router.refresh();
    } catch {
      showError("Erro inesperado ao reabrir a vaga.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ActionButton
      type="button"
      size="sm"
      icon={RefreshCw}
      disabled={busy}
      onClick={handleReopen}
      className="disabled:opacity-60"
    >
      Reabrir vaga
    </ActionButton>
  );
}
