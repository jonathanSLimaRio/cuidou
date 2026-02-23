"use client";

import { ActionButton } from "@/components/theme/action-button";
import { AlertCircle, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { signIn } from "next-auth/react";

type Props = {
  nextPath?: string;
  initialCode?: string;
  initialError?: string;
};

function mapLoginError(code?: string | null, error?: string | null) {
  if (code === "pending_approval") {
    return "Sua conta está pendente de aprovação administrativa.";
  }

  if (code === "account_suspended") {
    return "Sua conta está suspensa. Entre em contato com o suporte.";
  }

  if (code === "account_banned") {
    return "Sua conta foi banida e não pode acessar a plataforma.";
  }

  if (code === "credentials" || error === "CredentialsSignin") {
    return "Email ou senha inválidos.";
  }

  if (error === "OAuthAccountNotLinked") {
    return "Este e-mail já está vinculado a outro método de login.";
  }

  if (error) {
    return "Não foi possível entrar agora. Tente novamente.";
  }

  return null;
}

export function CredentialsLoginForm({
  nextPath = "/dashboard",
  initialCode,
  initialError,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const queryError = useMemo(
    () => mapLoginError(initialCode ?? null, initialError ?? null),
    [initialCode, initialError],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl: nextPath,
      });

      if (result?.ok && result.url) {
        router.push(result.url);
        router.refresh();
        return;
      }

      setErrorMessage(mapLoginError(result?.code, result?.error));
    } catch {
      setErrorMessage("Erro inesperado ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-[var(--theme-border)] bg-white p-4">
      <h2 className="text-xl">Entrar com email e senha</h2>
      <p className="mt-1 text-sm text-[var(--theme-muted)]">
        Use o cadastro local aprovado pela equipe para acessar sua conta.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
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
            placeholder="Sua senha"
            autoComplete="current-password"
            required
          />
        </label>

        {errorMessage || queryError ? (
          <p className="theme-alert theme-alert-danger inline-flex w-full items-center gap-2">
            <AlertCircle size={16} />
            {errorMessage ?? queryError}
          </p>
        ) : null}

        <ActionButton
          type="submit"
          icon={LogIn}
          className="w-full disabled:opacity-70"
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar com email e senha"}
        </ActionButton>
      </form>

      <p className="mt-3 text-sm text-[var(--theme-muted)]">
        Ainda não tem cadastro local?{" "}
        <Link href={`/signup${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`} className="text-[var(--theme-indigo)] underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
