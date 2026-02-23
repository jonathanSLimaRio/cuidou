"use client";

import { ActionButton } from "@/components/theme/action-button";
import { useToast } from "@/components/notifications/use-toast";
import { AppIcon } from "@/components/theme/app-icon";
import { ArrowRight, Baby, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function OnboardingRoleForm() {
  const router = useRouter();
  const { error: showError, warning } = useToast();
  const [role, setRole] = useState<"FAMILY" | "PROFESSIONAL">("FAMILY");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  async function submit() {
    if (!acceptTerms || !acceptPrivacy) {
      const message = "Você precisa aceitar os termos e a política para continuar.";
      setValidationError(message);
      warning("Validação pendente", message);
      return;
    }

    setLoading(true);
    setValidationError(null);

    try {
      const response = await fetch("/api/onboarding/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          acceptTerms,
          acceptPrivacy,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        showError("Não foi possível finalizar o onboarding.", payload.error);
        return;
      }

      router.push(payload.nextPath ?? "/dashboard");
      router.refresh();
    } catch {
      showError("Erro inesperado ao enviar onboarding.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-7 space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setRole("FAMILY")}
          className={`theme-list-card text-left ${
            role === "FAMILY" ? "border-[var(--theme-indigo)] bg-[var(--theme-pink)]/35" : ""
          }`}
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--theme-pink)]/60 text-[var(--theme-indigo-strong)]">
            <AppIcon icon={Baby} size="lg" />
          </span>
          <p className="theme-chip theme-chip-pink w-fit">Família</p>
          <p className="mt-3 text-xl font-display text-[var(--theme-navy)]">Publicar vagas e contratar</p>
          <p className="mt-2 text-sm text-[var(--theme-muted)]">
            Ideal para famílias que precisam encontrar babás e cuidadoras com segurança.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setRole("PROFESSIONAL")}
          className={`theme-list-card text-left ${
            role === "PROFESSIONAL" ? "border-[var(--theme-indigo)] bg-[var(--theme-sky)]/30" : ""
          }`}
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--theme-sky)]/55 text-[var(--theme-indigo-strong)]">
            <AppIcon icon={UserRound} size="lg" />
          </span>
          <p className="theme-chip theme-chip-blue w-fit">Profissional</p>
          <p className="mt-3 text-xl font-display text-[var(--theme-navy)]">Candidatar-se às vagas</p>
          <p className="mt-2 text-sm text-[var(--theme-muted)]">
            Para babás e cuidadoras que querem oportunidades alinhadas à sua disponibilidade.
          </p>
        </button>
      </div>

      <label className="flex items-start gap-2 rounded-xl border border-[var(--theme-border)] bg-white px-3 py-2.5 text-sm text-[var(--theme-body)]">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(event) => setAcceptTerms(event.target.checked)}
          className="mt-1"
        />
        Aceito os Termos de Uso.
      </label>

      <label className="flex items-start gap-2 rounded-xl border border-[var(--theme-border)] bg-white px-3 py-2.5 text-sm text-[var(--theme-body)]">
        <input
          type="checkbox"
          checked={acceptPrivacy}
          onChange={(event) => setAcceptPrivacy(event.target.checked)}
          className="mt-1"
        />
        Aceito a Política de Privacidade (LGPD).
      </label>

      {validationError ? <p className="theme-alert theme-alert-danger">{validationError}</p> : null}

      <ActionButton
        type="button"
        icon={loading ? ShieldCheck : ArrowRight}
        onClick={submit}
        disabled={loading}
        className="w-full disabled:opacity-60"
      >
        {loading ? "Salvando..." : "Finalizar onboarding"}
      </ActionButton>
    </div>
  );
}
