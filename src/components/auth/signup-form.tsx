"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { Baby, HeartHandshake, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type UserRoleOption = "FAMILY" | "PROFESSIONAL";
type SubtypeOption = "BABYSITTER" | "ELDER_CAREGIVER";

type Props = {
  nextPath?: string;
  presetRole?: UserRoleOption;
  presetSubtype?: SubtypeOption;
};

export function SignupForm({
  nextPath = "/dashboard",
  presetRole,
  presetSubtype,
}: Props) {
  const { error: showError, success } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRoleOption | undefined>(presetRole);
  const [subtype, setSubtype] = useState<SubtypeOption | undefined>(presetSubtype);
  const [loading, setLoading] = useState(false);

  const loginHref = useMemo(
    () => `/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`,
    [nextPath],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!role) {
      showError("Selecione seu tipo de perfil.", "Escolha entre Família ou Profissional.");
      return;
    }

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
          role,
          subtype: role === "PROFESSIONAL" ? subtype : undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        showError("Não foi possível criar sua conta.", payload.error);
        return;
      }

      success(
        "Cadastro enviado com sucesso.",
        payload.message ?? "Sua conta está pendente de aprovação administrativa.",
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

      {/* Role selector — hidden if preset from URL */}
      {!presetRole && (
        <fieldset>
          <legend className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">
            Meu perfil é
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              id="role-family-btn"
              onClick={() => { setRole("FAMILY"); setSubtype(undefined); }}
              className={`flex flex-col items-start gap-1 rounded-2xl border-2 px-4 py-3 text-left text-sm transition-all ${
                role === "FAMILY"
                  ? "border-[var(--theme-indigo)] bg-[var(--theme-indigo)]/8 text-[var(--theme-indigo)]"
                  : "border-[var(--theme-border)] bg-white text-[var(--theme-body)] hover:border-[var(--theme-indigo)]/50"
              }`}
            >
              <Users size={16} />
              <span className="font-semibold">Família</span>
              <span className="text-xs opacity-70">Quero contratar</span>
            </button>

            <button
              type="button"
              id="role-professional-btn"
              onClick={() => setRole("PROFESSIONAL")}
              className={`flex flex-col items-start gap-1 rounded-2xl border-2 px-4 py-3 text-left text-sm transition-all ${
                role === "PROFESSIONAL"
                  ? "border-[var(--theme-indigo)] bg-[var(--theme-indigo)]/8 text-[var(--theme-indigo)]"
                  : "border-[var(--theme-border)] bg-white text-[var(--theme-body)] hover:border-[var(--theme-indigo)]/50"
              }`}
            >
              <HeartHandshake size={16} />
              <span className="font-semibold">Profissional</span>
              <span className="text-xs opacity-70">Quero trabalhar</span>
            </button>
          </div>
        </fieldset>
      )}

      {/* Subtype selector for professionals */}
      {(role === "PROFESSIONAL") && !presetSubtype && (
        <fieldset>
          <legend className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">
            Especialidade
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              id="subtype-babysitter-btn"
              onClick={() => setSubtype("BABYSITTER")}
              className={`flex items-center gap-2 rounded-2xl border-2 px-4 py-2.5 text-sm transition-all ${
                subtype === "BABYSITTER"
                  ? "border-[var(--theme-indigo)] bg-[var(--theme-indigo)]/8 text-[var(--theme-indigo)]"
                  : "border-[var(--theme-border)] bg-white text-[var(--theme-body)] hover:border-[var(--theme-indigo)]/50"
              }`}
            >
              <Baby size={15} />
              Babá
            </button>
            <button
              type="button"
              id="subtype-caregiver-btn"
              onClick={() => setSubtype("ELDER_CAREGIVER")}
              className={`flex items-center gap-2 rounded-2xl border-2 px-4 py-2.5 text-sm transition-all ${
                subtype === "ELDER_CAREGIVER"
                  ? "border-[var(--theme-indigo)] bg-[var(--theme-indigo)]/8 text-[var(--theme-indigo)]"
                  : "border-[var(--theme-border)] bg-white text-[var(--theme-body)] hover:border-[var(--theme-indigo)]/50"
              }`}
            >
              <HeartHandshake size={15} />
              Cuidadora
            </button>
          </div>
        </fieldset>
      )}

      {/* Show preset summary if role came from URL */}
      {presetRole && (
        <div className="flex items-center gap-2 rounded-xl bg-[var(--theme-indigo)]/8 px-3 py-2 text-sm text-[var(--theme-indigo)]">
          {presetRole === "FAMILY" ? <Users size={15} /> : <HeartHandshake size={15} />}
          <span className="font-medium">
            {presetRole === "FAMILY"
              ? "Perfil: Família"
              : presetSubtype === "BABYSITTER"
                ? "Perfil: Babá"
                : presetSubtype === "ELDER_CAREGIVER"
                  ? "Perfil: Cuidadora de idosos"
                  : "Perfil: Profissional"}
          </span>
          <a href="/signup" className="ml-auto text-xs underline opacity-70 hover:opacity-100">
            Alterar
          </a>
        </div>
      )}

      <label className="block space-y-1">
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

      <label className="block space-y-1">
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

      <label className="block space-y-1">
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

      <label className="block space-y-1">
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
