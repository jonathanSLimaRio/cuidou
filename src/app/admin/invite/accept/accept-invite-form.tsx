"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  token: string;
};

export function AcceptInviteForm({ token }: Props) {
  const router = useRouter();
  const { error: showError, success } = useToast();
  const [loading, setLoading] = useState(false);

  async function acceptInvite() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/invites/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const payload = await response.json();
      if (!response.ok) {
        showError("Nao foi possivel aceitar o convite.", payload.error);
        return;
      }

      success("Convite aceito com sucesso.", "Sua conta agora possui permissao de admin.");
      router.push(payload.nextPath ?? "/admin");
      router.refresh();
    } catch {
      showError("Erro inesperado ao aceitar convite.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionButton type="button" icon={ShieldCheck} disabled={loading} onClick={acceptInvite}>
      {loading ? "Aceitando..." : "Aceitar convite de administrador"}
    </ActionButton>
  );
}
