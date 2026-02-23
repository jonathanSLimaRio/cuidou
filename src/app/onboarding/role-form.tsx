"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OnboardingRoleForm() {
  const router = useRouter();
  const [role, setRole] = useState<"FAMILY" | "PROFESSIONAL">("FAMILY");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!acceptTerms || !acceptPrivacy) {
      setError("Você precisa aceitar os termos e a política para continuar.");
      return;
    }

    setLoading(true);
    setError(null);

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
        setError(payload.error ?? "Não foi possível finalizar o onboarding.");
        return;
      }

      router.push(payload.nextPath ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Erro inesperado ao enviar onboarding.");
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
            role === "FAMILY"
              ? "border-[var(--theme-indigo)] bg-[var(--theme-pink)]/35"
              : ""
          }`}
        >
          <p className="font-display text-lg text-[var(--theme-navy)]">Família</p>
          <p className="mt-1 text-sm text-[var(--theme-muted)]">Publicar vagas e contratar</p>
        </button>

        <button
          type="button"
          onClick={() => setRole("PROFESSIONAL")}
          className={`theme-list-card text-left ${
            role === "PROFESSIONAL"
              ? "border-[var(--theme-indigo)] bg-[var(--theme-sky)]/30"
              : ""
          }`}
        >
          <p className="font-display text-lg text-[var(--theme-navy)]">Profissional</p>
          <p className="mt-1 text-sm text-[var(--theme-muted)]">Candidatar-se às vagas</p>
        </button>
      </div>

      <label className="flex items-start gap-2 rounded-xl border border-[var(--theme-border)] bg-white px-3 py-2 text-sm text-[var(--theme-body)]">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(event) => setAcceptTerms(event.target.checked)}
          className="mt-1"
        />
        Aceito os Termos de Uso.
      </label>

      <label className="flex items-start gap-2 rounded-xl border border-[var(--theme-border)] bg-white px-3 py-2 text-sm text-[var(--theme-body)]">
        <input
          type="checkbox"
          checked={acceptPrivacy}
          onChange={(event) => setAcceptPrivacy(event.target.checked)}
          className="mt-1"
        />
        Aceito a Política de Privacidade (LGPD).
      </label>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="btn-primary w-full disabled:opacity-60"
      >
        {loading ? "Salvando..." : "Finalizar onboarding"}
      </button>
    </div>
  );
}
