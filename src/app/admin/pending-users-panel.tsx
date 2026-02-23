"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { CheckCircle2, PauseCircle } from "lucide-react";
import { useState } from "react";

type PendingUserItem = {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
  status: "PENDING";
};

type Props = {
  initialUsers: PendingUserItem[];
};

export function PendingUsersPanel({ initialUsers }: Props) {
  const { error: showError, success } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateStatus(userId: string, status: "ACTIVE" | "SUSPENDED") {
    setBusyId(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const payload = await response.json();
      if (!response.ok) {
        showError("Falha ao atualizar status.", payload.error);
        return;
      }

      setUsers((current) => current.filter((user) => user.id !== userId));
      success(status === "ACTIVE" ? "Usuário aprovado." : "Usuário suspenso.");
    } catch {
      showError("Erro inesperado ao atualizar status.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
      <p className="theme-chip theme-chip-yellow w-fit">Cadastros pendentes</p>
      <h2 className="mt-3 text-3xl">Aprovação manual de contas locais</h2>
      <p className="mt-2 text-sm text-[var(--theme-body)]">
        Novos cadastros por email/senha entram como pendentes até revisão administrativa.
      </p>

      {users.length === 0 ? (
        <p className="theme-card-soft mt-4 rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
          Nenhum cadastro pendente no momento.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {users.map((user) => (
            <li key={user.id} className="theme-list-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-display text-[var(--theme-navy)]">
                    {user.name ?? "Sem nome"}
                  </p>
                  <p className="text-sm text-[var(--theme-muted)]">{user.email ?? "Sem email"}</p>
                  <p className="mt-1 text-xs text-[var(--theme-muted)]">
                    Criado em: {new Date(user.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    type="button"
                    size="sm"
                    icon={CheckCircle2}
                    disabled={busyId === user.id}
                    onClick={() => updateStatus(user.id, "ACTIVE")}
                  >
                    Aprovar
                  </ActionButton>
                  <ActionButton
                    type="button"
                    size="sm"
                    variant="secondary"
                    icon={PauseCircle}
                    disabled={busyId === user.id}
                    onClick={() => updateStatus(user.id, "SUSPENDED")}
                  >
                    Suspender
                  </ActionButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
