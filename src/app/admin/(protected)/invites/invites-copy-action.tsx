"use client";

import { useToast } from "@/components/notifications/use-toast";
import { Copy } from "lucide-react";
import { useState } from "react";

type InvitesCopyActionProps = {
  token: string;
};

export function InvitesCopyAction({ token }: InvitesCopyActionProps) {
  const [copied, setCopied] = useState(false);
  const { success, error } = useToast();

  async function handleCopy() {
    try {
      // The process.env approach in client components only works for EXACT keys
      const baseUrl = window.location.origin;
      const acceptUrl = `${baseUrl}/admin/invite/accept?token=${encodeURIComponent(token)}`;
      
      await navigator.clipboard.writeText(acceptUrl);
      setCopied(true);
      success("Link copiado para a área de transferência.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      error("Falha ao copiar. Seu navegador não suporta a área de transferência.");
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        copied
          ? "bg-[rgba(57,210,138,0.15)] text-[var(--admin-success)]"
          : "bg-[var(--admin-panel-2)] text-[var(--admin-accent)] hover:bg-[rgba(124,142,255,0.15)]"
      }`}
    >
      <Copy className="h-3 w-3" />
      {copied ? "Copiado!" : "Copiar Link"}
    </button>
  );
}
