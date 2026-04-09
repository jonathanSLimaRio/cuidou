"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { MailPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function InvitesCreation() {
  const [email, setEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setBusy(true);
    try {
      const response = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), expiresInDays }),
      });

      const payload = await response.json();
      if (!response.ok) {
        error("Falha ao emitir convite.", payload.error);
        return;
      }

      success("Convite emitido com sucesso.");
      setEmail("");
      setExpiresInDays(7);
      router.refresh();
    } catch {
      error("Erro de conexão ao emitir convite.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="theme-card-deep mb-8 rounded-[32px] px-5 py-6 sm:px-7 sm:py-7">
      <h2 className="text-xl font-medium text-white mb-4">Gerar Novo Convite</h2>
      <form onSubmit={handleCreate} className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
        <label className="space-y-1 block">
          <span className="text-xs uppercase tracking-wider text-[var(--admin-text-dim)]">E-mail do novo administrador</span>
          <input
            type="email"
            required
            className="theme-field py-2 px-3 text-sm"
            placeholder="admin@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
        </label>

        <label className="space-y-1 block">
          <span className="text-xs uppercase tracking-wider text-[var(--admin-text-dim)]">Validade (dias)</span>
          <select
            className="theme-select py-2 px-3 text-sm bg-opacity-50"
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(Number(e.target.value))}
            disabled={busy}
          >
            <option value={1}>1 Dia</option>
            <option value={3}>3 Dias</option>
            <option value={7}>7 Dias</option>
            <option value={15}>15 Dias</option>
            <option value={30}>30 Dias</option>
          </select>
        </label>

        <ActionButton
          type="submit"
          variant="primary"
          icon={MailPlus}
          disabled={busy}
          className="h-10 px-6 rounded-xl"
        >
          Enviar Convite
        </ActionButton>
      </form>
    </section>
  );
}
