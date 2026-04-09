"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { ShieldAlert, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { signIn } from "next-auth/react";

type Props = {
  nextPath?: string;
  initialCode?: string;
  initialError?: string;
};

function mapAdminLoginError(code?: string | null, error?: string | null) {
  if (code === "admin_only") {
    return "Esta conta não tem permissão de administrador.";
  }

  if (code === "pending_approval") {
    return "Conta pendente de aprovação. Contate o suporte.";
  }

  if (code === "account_suspended") {
    return "Conta suspensa. Contate o suporte.";
  }

  if (code === "account_banned") {
    return "Conta banida. Acesso negado.";
  }

  if (code === "credentials" || error === "CredentialsSignin") {
    return "Email ou senha inválidos.";
  }

  if (error) {
    return "Não foi possível entrar agora. Tente novamente.";
  }

  return null;
}

export function AdminLoginForm({
  nextPath = "/admin",
  initialCode,
  initialError,
}: Props) {
  const router = useRouter();
  const { error: showError } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const hasShownQueryErrorRef = useRef(false);

  const queryError = useMemo(
    () => mapAdminLoginError(initialCode ?? null, initialError ?? null),
    [initialCode, initialError],
  );

  useEffect(() => {
    if (!queryError || hasShownQueryErrorRef.current) {
      return;
    }
    showError("Acesso negado.", queryError);
    hasShownQueryErrorRef.current = true;
  }, [queryError, showError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl: nextPath,
      });

      if (!result?.ok) {
        showError(
          "Falha no acesso.",
          mapAdminLoginError(result?.code, result?.error) ?? undefined,
        );
        return;
      }

      // After successful auth, verify server-side that the user is actually ADMIN.
      // The middleware will enforce this, but we give proactive feedback here.
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user?.role !== "ADMIN") {
        // Sign out silently and show clear error — they authenticated but aren't admin
        await signIn("credentials", { redirect: false }); // won't re-auth, just ensure no stale state
        showError(
          "Acesso negado.",
          "Esta conta não tem permissão de acesso ao painel administrativo.",
        );
        // Redirect to sign out so the session is cleared
        router.push("/api/auth/signout");
        return;
      }

      router.push(result.url ?? nextPath);
      router.refresh();
    } catch {
      showError("Erro inesperado ao entrar.", "Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
          <ShieldAlert size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">Login administrativo</p>
          <p className="text-xs text-white/50">Apenas administradores autorizados</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.07em] text-white/50">
            Email
          </span>
          <input
            id="admin-email"
            type="email"
            className="theme-field bg-white/10 text-white placeholder:text-white/30 border-white/15 focus:border-white/40"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@cuidou.app"
            autoComplete="email"
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.07em] text-white/50">
            Senha
          </span>
          <input
            id="admin-password"
            type="password"
            className="theme-field bg-white/10 text-white placeholder:text-white/30 border-white/15 focus:border-white/40"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sua senha de acesso"
            autoComplete="current-password"
            required
          />
        </label>

        <ActionButton
          type="submit"
          icon={LogIn}
          className="w-full disabled:opacity-70"
          disabled={loading}
          style={{ marginTop: "1rem" }}
        >
          {loading ? "Verificando acesso..." : "Entrar no backoffice"}
        </ActionButton>
      </form>

      <p className="mt-4 text-center text-xs text-white/30">
        Não é administrador?{" "}
        <a href="/login" className="underline hover:text-white/60">
          Login de usuário
        </a>
      </p>
    </div>
  );
}
