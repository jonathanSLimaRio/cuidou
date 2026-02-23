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
    <div className="mt-6 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setRole("FAMILY")}
          className={`rounded-lg border px-4 py-3 text-left ${
            role === "FAMILY"
              ? "border-zinc-900 bg-zinc-100"
              : "border-black/10 bg-white"
          }`}
        >
          <p className="font-medium">Família</p>
          <p className="text-sm text-zinc-600">Publicar vagas e contratar</p>
        </button>

        <button
          type="button"
          onClick={() => setRole("PROFESSIONAL")}
          className={`rounded-lg border px-4 py-3 text-left ${
            role === "PROFESSIONAL"
              ? "border-zinc-900 bg-zinc-100"
              : "border-black/10 bg-white"
          }`}
        >
          <p className="font-medium">Profissional</p>
          <p className="text-sm text-zinc-600">Candidatar-se às vagas</p>
        </button>
      </div>

      <label className="flex items-start gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(event) => setAcceptTerms(event.target.checked)}
          className="mt-1"
        />
        Aceito os Termos de Uso.
      </label>

      <label className="flex items-start gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={acceptPrivacy}
          onChange={(event) => setAcceptPrivacy(event.target.checked)}
          className="mt-1"
        />
        Aceito a Política de Privacidade (LGPD).
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {loading ? "Salvando..." : "Finalizar onboarding"}
      </button>
    </div>
  );
}
