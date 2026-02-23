"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type Props = {
  nextPath?: string;
};

export function SignupForm({ nextPath = "/dashboard" }: Props) {
  const { error: showError, success } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const loginHref = useMemo(
    () => `/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`,
    [nextPath],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        showError("Não foi possível criar sua conta.", payload.error);
        return;
      }

      success(
        "Cadastro enviado com sucesso.",
        payload.message ??
          "Sua conta está pendente de aprovação administrativa.",
      );
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      showError("Erro inesperado ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <label className="space-y-1">
        <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Nome</span>
        <input
          type="text"
          className="theme-field"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Seu nome completo"
          autoComplete="name"
          required
        />
      </label>

      <label className="space-y-1">
        <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Email</span>
        <input
          type="email"
          className="theme-field"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@exemplo.com"
          autoComplete="email"
          required
        />
      </label>

      <label className="space-y-1">
        <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Senha</span>
        <input
          type="password"
          className="theme-field"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo 8 caracteres com letra e número"
          autoComplete="new-password"
          required
        />
      </label>

      <label className="space-y-1">
        <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Confirmar senha</span>
        <input
          type="password"
          className="theme-field"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repita sua senha"
          autoComplete="new-password"
          required
        />
      </label>

      <ActionButton type="submit" icon={UserPlus} className="w-full disabled:opacity-70" disabled={loading}>
        {loading ? "Enviando..." : "Criar conta"}
      </ActionButton>

      <p className="text-sm text-[var(--theme-muted)]">
        Já tem conta?{" "}
        <Link href={loginHref} className="text-[var(--theme-indigo)] underline">
          Ir para login
        </Link>
      </p>
    </form>
  );
}
