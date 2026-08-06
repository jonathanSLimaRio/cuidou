"use client";

import { ActionButton } from "@/components/theme/action-button";
import { useToast } from "@/components/notifications/use-toast";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { refreshLegalConsentSession } from "./actions";

export function ConsentForm() {
  const toast = useToast();
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!terms || !privacy) {
      toast.warning("Aceite necessário", "Leia e aceite os dois documentos para continuar.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/legal/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptedTerms: terms, acceptedPrivacy: privacy }),
      });
      const payload = await response.json();
      if (!response.ok) {
        toast.error("Não foi possível registrar o aceite.", payload.error);
        return;
      }
      await refreshLegalConsentSession();
    } catch {
      toast.error("Não foi possível registrar o aceite.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 space-y-3">
      <label className="flex min-h-11 items-start gap-3 rounded-2xl border border-[var(--theme-border)] p-4">
        <input className="mt-1 h-5 w-5" type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} />
        <span>Li e aceito os <Link className="font-medium underline" href="/terms" target="_blank">Termos de Uso</Link>.</span>
      </label>
      <label className="flex min-h-11 items-start gap-3 rounded-2xl border border-[var(--theme-border)] p-4">
        <input className="mt-1 h-5 w-5" type="checkbox" checked={privacy} onChange={(event) => setPrivacy(event.target.checked)} />
        <span>Li e aceito a <Link className="font-medium underline" href="/privacy" target="_blank">Política de Privacidade</Link>.</span>
      </label>
      <ActionButton className="w-full" type="button" icon={ShieldCheck} disabled={loading} onClick={submit}>
        {loading ? "Registrando..." : "Aceitar e continuar"}
      </ActionButton>
    </div>
  );
}
