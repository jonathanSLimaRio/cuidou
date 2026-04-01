"use client";

import { StatusBadge } from "@/components/theme/status-badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type AuditLogItem = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  admin: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

const ACTION_OPTIONS = [
  "DOCUMENT_APPROVED",
  "DOCUMENT_REJECTED",
  "REPORT_RESOLVED",
  "REPORT_DISMISSED",
  "JOB_STATUS_UPDATED",
  "USER_STATUS_UPDATED",
  "ADMIN_INVITE_CREATED",
  "CONTRACT_COMPLETED",
  "CONTRACT_CANCELED",
] as const;

const TARGET_TYPE_OPTIONS = [
  "USER",
  "DOCUMENT",
  "JOB",
  "REPORT",
  "ADMIN_INVITE",
  "CONTRACT",
] as const;

function actionTone(action: string) {
  if (action.includes("APPROVED") || action.includes("RESOLVED") || action.includes("COMPLETED")) {
    return "success" as const;
  }
  if (action.includes("REJECTED") || action.includes("DISMISSED") || action.includes("CANCELED")) {
    return "danger" as const;
  }
  return "info" as const;
}

export function AuditLogViewer() {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filterAction, setFilterAction] = useState("");
  const [filterTargetType, setFilterTargetType] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "50" });
      if (filterAction) params.set("action", filterAction);
      if (filterTargetType) params.set("targetType", filterTargetType);
      if (filterFrom) params.set("from", filterFrom);
      if (filterTo) params.set("to", filterTo);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterTargetType, filterFrom, filterTo]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters() {
    setPage(1);
    void load();
  }

  return (
    <section className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
      <p className="theme-chip theme-chip-indigo w-fit">Auditoria</p>
      <h2 className="mt-3 text-3xl">Log de auditoria</h2>
      <p className="mt-2 text-sm text-[var(--theme-body)]">
        {total} registro(s) no total. Ações administrativas rastreadas.
      </p>

      {/* Filters */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Ação</span>
          <select
            className="theme-select w-full"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="">Todas</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Tipo de alvo</span>
          <select
            className="theme-select w-full"
            value={filterTargetType}
            onChange={(e) => setFilterTargetType(e.target.value)}
          >
            <option value="">Todos</option>
            {TARGET_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">De</span>
          <input
            type="date"
            className="theme-field"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Até</span>
          <input
            type="date"
            className="theme-field"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
        </label>
      </div>
      <button
        type="button"
        onClick={applyFilters}
        className="mt-3 rounded-full bg-[var(--brand-purple-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-purple-secondary)]"
      >
        Filtrar
      </button>

      {/* List */}
      <div className="mt-5 space-y-2">
        {loading ? (
          <p className="text-sm text-[var(--theme-muted)]">Carregando...</p>
        ) : items.length === 0 ? (
          <p className="theme-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
            Nenhum registro encontrado.
          </p>
        ) : (
          items.map((item) => (
            <article key={item.id} className="theme-list-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={actionTone(item.action)}>{item.action}</StatusBadge>
                <StatusBadge tone="neutral">{item.targetType}</StatusBadge>
              </div>
              <p className="mt-1.5 text-sm text-[var(--theme-body)]">
                Admin: {item.admin.name ?? item.admin.email ?? item.admin.id}
                {item.targetId ? ` • Alvo: ${item.targetId}` : ""}
              </p>
              {item.metadata && Object.keys(item.metadata).length > 0 ? (
                <p className="mt-1 text-xs text-[var(--theme-muted)]">
                  {Object.entries(item.metadata)
                    .map(([k, v]) => `${k}: ${String(v)}`)
                    .join(" • ")}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-[var(--theme-muted)]">
                {new Date(item.createdAt).toLocaleString("pt-BR")}
              </p>
            </article>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--theme-border)] px-3 py-1.5 text-sm text-[var(--theme-navy)] disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          <span className="text-sm text-[var(--theme-muted)]">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--theme-border)] px-3 py-1.5 text-sm text-[var(--theme-navy)] disabled:opacity-40"
          >
            Próxima <ChevronRight size={14} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
