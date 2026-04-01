"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { StatusBadge } from "@/components/theme/status-badge";
import { Bell, Check, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type NotificationData = {
  applicationId?: string;
  contractId?: string;
  conversationId?: string;
  jobId?: string;
  reviewId?: string;
};

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  createdAt: string;
  readAt: string | null;
  data: NotificationData | null;
};

type NotificationPayload = {
  items: NotificationItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const PAGE_SIZE = 20;

function resolveDeepLink(data: NotificationData | null): string | null {
  if (!data) return null;
  if (data.conversationId) return `/chat/${data.conversationId}`;
  if (data.contractId) return "/family#gestao-contratos";
  if (data.applicationId) return "/family#pipeline-candidaturas";
  if (data.jobId) return `/marketplace/jobs/${data.jobId}`;
  return null;
}

export function NotificationsCenter() {
  const { error: showError, success } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => items.filter((item) => item.readAt === null).length,
    [items],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/notifications?page=${page}&pageSize=${PAGE_SIZE}&unreadOnly=${unreadOnly}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as NotificationPayload & { error?: string };

      if (!response.ok) {
        showError("Falha ao carregar notificacoes.", payload.error);
        return;
      }

      setItems(payload.items ?? []);
      setTotalPages(payload.totalPages ?? 1);
    } catch {
      showError("Erro inesperado ao carregar notificacoes.");
    } finally {
      setLoading(false);
    }
  }, [page, showError, unreadOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markAllAsRead() {
    setBusy(true);
    try {
      const response = await fetch("/api/notifications", { method: "PATCH" });
      const payload = await response.json();
      if (!response.ok) {
        showError("Falha ao marcar notificacoes como lidas.", payload.error);
        return;
      }
      success("Notificacoes marcadas como lidas.");
      await load();
    } catch {
      showError("Erro inesperado ao atualizar notificacoes.");
    } finally {
      setBusy(false);
    }
  }

  async function markAsRead(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      if (!response.ok) return false;
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
        ),
      );
      return true;
    } catch {
      return false;
    }
  }

  async function handleNotificationClick(item: NotificationItem) {
    const href = resolveDeepLink(item.data);
    if (item.readAt === null) {
      await markAsRead(item.id);
    }
    if (href) {
      router.push(href);
    }
  }

  async function dismissNotification(id: string) {
    setDismissingId(id);
    await markAsRead(id);
    setDismissingId(null);
  }

  return (
    <section className="theme-card rounded-[34px] px-6 py-7 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="theme-chip theme-chip-blue w-fit">Notificacoes</p>
          <h2 className="mt-2 text-3xl">Central de notificacoes</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="info">{unreadCount} nao lidas nesta pagina</StatusBadge>
          <ActionButton
            type="button"
            size="sm"
            variant="secondary"
            icon={Check}
            disabled={busy}
            onClick={markAllAsRead}
          >
            Marcar todas como lidas
          </ActionButton>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton
          type="button"
          size="sm"
          icon={Bell}
          variant={unreadOnly ? "secondary" : "primary"}
          onClick={() => { setUnreadOnly(false); setPage(1); }}
        >
          Todas
        </ActionButton>
        <ActionButton
          type="button"
          size="sm"
          icon={Filter}
          variant={unreadOnly ? "primary" : "secondary"}
          onClick={() => { setUnreadOnly(true); setPage(1); }}
        >
          Apenas nao lidas
        </ActionButton>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-sm text-[var(--theme-muted)]">Carregando notificacoes...</p>
        ) : items.length === 0 ? (
          <p className="theme-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
            Nenhuma notificacao encontrada para este filtro.
          </p>
        ) : (
          items.map((item) => {
            const href = resolveDeepLink(item.data);
            const isClickable = Boolean(href);
            const isUnread = item.readAt === null;

            return (
              <article
                key={item.id}
                className={[
                  "theme-list-card relative p-4 transition-colors",
                  isUnread ? "border-l-4 border-l-[var(--brand-purple-primary)]" : "",
                  isClickable ? "cursor-pointer hover:bg-[var(--theme-cream)]" : "",
                ].join(" ")}
                onClick={isClickable ? () => void handleNotificationClick(item) : undefined}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={isUnread ? "warning" : "neutral"}>
                    {isUnread ? "Nao lida" : "Lida"}
                  </StatusBadge>
                  <StatusBadge tone="info">{item.type}</StatusBadge>
                  {isClickable && (
                    <StatusBadge tone="blue">Clique para abrir</StatusBadge>
                  )}
                </div>
                <h3 className="mt-2 text-xl text-[var(--theme-navy)]">{item.title}</h3>
                {item.body ? (
                  <p className="mt-1 text-sm text-[var(--theme-body)]">{item.body}</p>
                ) : null}
                <p className="mt-2 text-xs text-[var(--theme-muted)]">
                  {new Date(item.createdAt).toLocaleString("pt-BR")}
                </p>

                {isUnread && (
                  <button
                    type="button"
                    disabled={dismissingId === item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      void dismissNotification(item.id);
                    }}
                    className="absolute right-3 top-3 rounded-full p-1 text-[var(--theme-muted)] hover:bg-[var(--theme-bg-soft)] disabled:opacity-40"
                    title="Marcar como lida"
                  >
                    <X size={14} />
                  </button>
                )}
              </article>
            );
          })
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <ActionButton
          type="button"
          size="sm"
          variant="secondary"
          icon={ChevronLeft}
          disabled={page <= 1 || loading}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          Pagina anterior
        </ActionButton>
        <StatusBadge tone="neutral">
          Pagina {page} de {Math.max(totalPages, 1)}
        </StatusBadge>
        <ActionButton
          type="button"
          size="sm"
          variant="secondary"
          icon={ChevronRight}
          disabled={page >= totalPages || loading}
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
        >
          Proxima pagina
        </ActionButton>
      </div>
    </section>
  );
}
