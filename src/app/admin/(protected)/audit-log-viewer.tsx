"use client";

import { StatusBadge } from "@/components/theme/status-badge";
import {
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  FileX,
  Flag,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";
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
  "APPLICATION_WITHDRAWN",
  "INVITATION_STATUS_UPDATED",
] as const;

const TARGET_TYPE_OPTIONS = [
  "USER",
  "DOCUMENT",
  "JOB",
  "REPORT",
  "ADMIN_INVITE",
  "CONTRACT",
  "APPLICATION",
  "INVITATION",
] as const;

type ActionTone = "success" | "danger" | "warning" | "info" | "neutral";

function actionConfig(action: string): { tone: ActionTone; icon: typeof CheckCircle; label: string } {
  if (action === "DOCUMENT_APPROVED") return { tone: "success", icon: FileCheck, label: "Documento aprovado" };
  if (action === "DOCUMENT_REJECTED") return { tone: "danger", icon: FileX, label: "Documento rejeitado" };
  if (action === "REPORT_RESOLVED") return { tone: "success", icon: CheckCircle, label: "Denúncia resolvida" };
  if (action === "REPORT_DISMISSED") return { tone: "neutral", icon: XCircle, label: "Denúncia descartada" };
  if (action === "JOB_STATUS_UPDATED") return { tone: "info", icon: RefreshCw, label: "Vaga atualizada" };
  if (action === "USER_STATUS_UPDATED:ACTIVE") return { tone: "success", icon: UserCheck, label: "Usuário ativado" };
  if (action === "USER_STATUS_UPDATED:SUSPENDED") return { tone: "warning", icon: UserX, label: "Usuário suspenso" };
  if (action === "USER_STATUS_UPDATED:BANNED") return { tone: "danger", icon: Ban, label: "Usuário banido" };
  if (action === "USER_STATUS_UPDATED") return { tone: "warning", icon: UserX, label: "Status atualizado" };
  if (action === "ADMIN_INVITE_CREATED") return { tone: "info", icon: ShieldCheck, label: "Convite criado" };
  if (action === "CONTRACT_COMPLETED") return { tone: "success", icon: CheckCircle, label: "Contrato concluído" };
  if (action === "CONTRACT_CANCELED") return { tone: "danger", icon: Trash2, label: "Contrato cancelado" };
  if (action === "APPLICATION_WITHDRAWN") return { tone: "warning", icon: XCircle, label: "Candidatura retirada" };
  if (action === "INVITATION_STATUS_UPDATED") return { tone: "info", icon: RefreshCw, label: "Convite atualizado" };
  return { tone: "neutral", icon: Flag, label: action };
}

const TONE_COLORS: Record<ActionTone, { text: string; bg: string; border: string }> = {
  success: { text: "var(--admin-success)", bg: "rgba(57, 210, 138, 0.08)", border: "rgba(57, 210, 138, 0.2)" },
  danger: { text: "var(--admin-danger)", bg: "rgba(244, 113, 116, 0.08)", border: "rgba(244, 113, 116, 0.2)" },
  warning: { text: "var(--admin-warning)", bg: "rgba(245, 179, 71, 0.08)", border: "rgba(245, 179, 71, 0.2)" },
  info: { text: "var(--admin-accent)", bg: "rgba(124, 142, 255, 0.08)", border: "rgba(124, 142, 255, 0.2)" },
  neutral: { text: "var(--admin-text-dim)", bg: "rgba(141, 153, 196, 0.06)", border: "rgba(141, 153, 196, 0.15)" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByDate(items: AuditLogItem[]) {
  const groups: Record<string, AuditLogItem[]> = {};
  for (const item of items) {
    const day = new Date(item.createdAt).toLocaleDateString("pt-BR");
    if (!groups[day]) {
      groups[day] = [];
    }
    groups[day].push(item);
  }
  return groups;
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
      const params = new URLSearchParams({ page: String(page), pageSize: "30" });
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

  function resetFilters() {
    setFilterAction("");
    setFilterTargetType("");
    setFilterFrom("");
    setFilterTo("");
    setPage(1);
  }

  const grouped = groupByDate(items);
  const hasActiveFilter = filterAction || filterTargetType || filterFrom || filterTo;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--admin-accent)" }}
        >
          Auditoria
        </p>
        <h1
          className="mt-1 text-3xl font-semibold"
          style={{ color: "var(--admin-text)", fontFamily: "inherit" }}
        >
          Log de auditoria
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--admin-text-dim)" }}>
          {total.toLocaleString("pt-BR")} registro{total !== 1 ? "s" : ""} de ações administrativas rastreadas.
        </p>
      </div>

      {/* Filters card */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: "var(--admin-panel)", borderColor: "var(--admin-border)" }}
      >
        <p
          className="mb-3 text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--admin-text-dim)" }}
        >
          Filtros
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--admin-text-dim)" }}>
              Ação
            </span>
            <select
              className="theme-select w-full"
              value={filterAction}
              onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
            >
              <option value="">Todas as ações</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>{actionConfig(a).label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--admin-text-dim)" }}>
              Tipo de alvo
            </span>
            <select
              className="theme-select w-full"
              value={filterTargetType}
              onChange={(e) => { setFilterTargetType(e.target.value); setPage(1); }}
            >
              <option value="">Todos os tipos</option>
              {TARGET_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--admin-text-dim)" }}>
              De
            </span>
            <input
              type="date"
              className="theme-field"
              value={filterFrom}
              onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--admin-text-dim)" }}>
              Até
            </span>
            <input
              type="date"
              className="theme-field"
              value={filterTo}
              onChange={(e) => { setFilterTo(e.target.value); setPage(1); }}
            />
          </label>
        </div>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              borderColor: "var(--admin-border)",
              color: "var(--admin-text-dim)",
              cursor: "pointer",
            }}
          >
            <XCircle size={12} />
            Limpar filtros
          </button>
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl"
              style={{ background: "var(--admin-panel)" }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          className="rounded-2xl border p-8 text-center text-sm"
          style={{ borderColor: "var(--admin-border)", background: "var(--admin-panel)", color: "var(--admin-text-dim)" }}
        >
          Nenhum registro encontrado para os filtros selecionados.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, dayItems]) => (
            <div key={day}>
              {/* Date divider */}
              <div className="mb-3 flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: "var(--admin-border)" }} />
                <span
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{
                    borderColor: "var(--admin-border)",
                    background: "var(--admin-panel-2)",
                    color: "var(--admin-text-dim)",
                  }}
                >
                  {day}
                </span>
                <div className="h-px flex-1" style={{ background: "var(--admin-border)" }} />
              </div>

              {/* Items for this day */}
              <div className="relative space-y-2 pl-6">
                {/* Timeline line */}
                <div
                  className="absolute left-2 top-0 bottom-0 w-px"
                  style={{ background: "var(--admin-border)" }}
                />

                {dayItems.map((item) => {
                  const config = actionConfig(item.action);
                  const colors = TONE_COLORS[config.tone];
                  const Icon = config.icon;

                  return (
                    <article
                      key={item.id}
                      className="relative rounded-2xl border p-4 transition-all"
                      style={{
                        background: colors.bg,
                        borderColor: colors.border,
                      }}
                    >
                      {/* Timeline dot */}
                      <span
                        className="absolute -left-[1.25rem] top-4 flex h-4 w-4 items-center justify-center rounded-full border"
                        style={{
                          background: "var(--admin-panel)",
                          borderColor: colors.border,
                        }}
                      >
                        <Icon size={9} style={{ color: colors.text }} />
                      </span>

                      <div className="flex flex-wrap items-start gap-3">
                        {/* Action badge */}
                        <div
                          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
                          style={{
                            borderColor: colors.border,
                            background: colors.bg,
                            color: colors.text,
                          }}
                        >
                          <Icon size={11} />
                          {config.label}
                        </div>
                        <StatusBadge tone="neutral">{item.targetType}</StatusBadge>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs" style={{ color: "var(--admin-text-dim)" }}>
                        <span>
                          Admin:{" "}
                          <span style={{ color: "var(--admin-text)" }}>
                            {item.admin.name ?? item.admin.email ?? item.admin.id}
                          </span>
                          {item.targetId ? (
                            <>
                              {" "}• Alvo:{" "}
                              <span
                                style={{
                                  fontFamily: "monospace",
                                  fontSize: "0.7rem",
                                  color: "var(--admin-accent)",
                                }}
                              >
                                {item.targetId.slice(0, 8)}…
                              </span>
                            </>
                          ) : null}
                        </span>
                        <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                      </div>

                      {/* Metadata */}
                      {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <div
                          className="mt-2 flex flex-wrap gap-2"
                        >
                          {Object.entries(item.metadata).map(([k, v]) => (
                            <span
                              key={k}
                              className="rounded-lg px-2 py-0.5 text-xs"
                              style={{
                                background: "var(--admin-panel-2)",
                                color: "var(--admin-text-dim)",
                              }}
                            >
                              <span style={{ color: "var(--admin-accent)", fontSize: "0.65rem" }}>{k}</span>
                              {": "}
                              {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between rounded-2xl border p-3"
          style={{ background: "var(--admin-panel)", borderColor: "var(--admin-border)" }}
        >
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              borderColor: "var(--admin-border)",
              color: "var(--admin-text)",
              background: "var(--admin-panel-2)",
            }}
          >
            <ChevronLeft size={14} />
            Anterior
          </button>
          <span className="text-xs" style={{ color: "var(--admin-text-dim)" }}>
            Página <strong style={{ color: "var(--admin-text)" }}>{page}</strong> de{" "}
            <strong style={{ color: "var(--admin-text)" }}>{totalPages}</strong>
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              borderColor: "var(--admin-border)",
              color: "var(--admin-text)",
              background: "var(--admin-panel-2)",
            }}
          >
            Próxima
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
