import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { adminRepository } from "@/src/lib/api/admin-repository";

const PAGE_SIZE = 50;

const ACTION_OPTIONS = [
  { label: "Todas", value: "" },
  { label: "Doc aprovado", value: "DOCUMENT_APPROVED" },
  { label: "Doc rejeitado", value: "DOCUMENT_REJECTED" },
  { label: "Denúncia resolvida", value: "REPORT_RESOLVED" },
  { label: "Denúncia descartada", value: "REPORT_DISMISSED" },
  { label: "Vaga atualizada", value: "JOB_STATUS_UPDATED" },
  { label: "Usuário atualizado", value: "USER_STATUS_UPDATED" },
  { label: "Convite criado", value: "ADMIN_INVITE_CREATED" },
  { label: "Contrato concluído", value: "CONTRACT_COMPLETED" },
  { label: "Contrato cancelado", value: "CONTRACT_CANCELED" },
  { label: "Candidatura retirada", value: "APPLICATION_WITHDRAWN" },
  { label: "Convite atualizado", value: "INVITATION_STATUS_UPDATED" },
];

const TARGET_TYPE_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Usuário", value: "USER" },
  { label: "Documento", value: "DOCUMENT" },
  { label: "Vaga", value: "JOB" },
  { label: "Denúncia", value: "REPORT" },
  { label: "Convite admin", value: "ADMIN_INVITE" },
  { label: "Contrato", value: "CONTRACT" },
  { label: "Candidatura", value: "APPLICATION" },
  { label: "Convite", value: "INVITATION" },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function actionLabel(action: string): string {
  const found = ACTION_OPTIONS.find((o) => o.value === action);
  return found?.label ?? action;
}

function targetTypeLabel(type: string): string {
  const found = TARGET_TYPE_OPTIONS.find((o) => o.value === type);
  return found?.label ?? type;
}

export default function AuditLogScreen() {
  const [actionFilter, setActionFilter] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("");

  // Applied filters
  const [appliedAction, setAppliedAction] = useState("");
  const [appliedTargetType, setAppliedTargetType] = useState("");

  const query = useInfiniteQuery({
    queryKey: ["admin-audit-logs", appliedAction, appliedTargetType],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      adminRepository.listAuditLogs({
        action: appliedAction || undefined,
        targetType: appliedTargetType || undefined,
        page: pageParam,
        pageSize: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data?.pages],
  );

  const total = query.data?.pages[0]?.total ?? 0;

  function applyFilters() {
    setAppliedAction(actionFilter);
    setAppliedTargetType(targetTypeFilter);
  }

  function resetFilters() {
    setActionFilter("");
    setTargetTypeFilter("");
    setAppliedAction("");
    setAppliedTargetType("");
  }

  return (
    <ScreenShell
      title="Trilha de auditoria"
      subtitle="Registro de todas as ações administrativas."
    >
      <Link href="/(admin)" asChild>
        <Button label="← Painel admin" variant="secondary" />
      </Link>

      {/* Filters */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Filtros</Text>

        <Text style={styles.filterLabel}>Ação</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {ACTION_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setActionFilter(opt.value)}
              style={[styles.chip, actionFilter === opt.value && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  actionFilter === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.filterLabel}>Tipo de alvo</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {TARGET_TYPE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setTargetTypeFilter(opt.value)}
              style={[
                styles.chip,
                targetTypeFilter === opt.value && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  targetTypeFilter === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.actionRow}>
          <Button label="Aplicar" onPress={applyFilters} />
          <Button label="Limpar" variant="secondary" onPress={resetFilters} />
        </View>
      </View>

      {/* Loading / Error / Empty */}
      {query.isPending ? <LoadingBlock label="Carregando trilha de auditoria..." /> : null}

      {query.isError ? (
        <ErrorState
          title="Falha ao carregar"
          description="Não foi possível buscar os registros de auditoria."
          onRetry={() => query.refetch()}
        />
      ) : null}

      {!query.isPending && !query.isError && items.length === 0 ? (
        <EmptyState
          title="Nenhum registro encontrado"
          description="Ajuste os filtros ou aguarde novas ações administrativas."
        />
      ) : null}

      {/* Total count */}
      {items.length > 0 ? (
        <Text style={styles.countLabel}>
          Exibindo {items.length} de {total} registro(s)
        </Text>
      ) : null}

      {/* Log entries */}
      {items.map((entry) => (
        <View key={entry.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>{actionLabel(entry.action)}</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(entry.createdAt)}</Text>
          </View>

          <Text style={styles.adminText}>
            Admin: {entry.admin.name ?? entry.admin.email ?? entry.adminId}
          </Text>

          <Text style={styles.targetText}>
            Alvo: {targetTypeLabel(entry.targetType)}
            {entry.targetId ? ` — ${entry.targetId}` : ""}
          </Text>

          {entry.metadata ? (
            <Text style={styles.metaText} numberOfLines={3}>
              {JSON.stringify(entry.metadata)}
            </Text>
          ) : null}
        </View>
      ))}

      {query.hasNextPage ? (
        <Button
          label="Carregar mais"
          onPress={() => query.fetchNextPage()}
          loading={query.isFetchingNextPage}
        />
      ) : items.length > 0 ? (
        <Text style={styles.endLabel}>Fim da lista.</Text>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.sm,
  },
  panelTitle: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.lg,
    fontWeight: appTheme.typography.weight.semibold,
  },
  filterLabel: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.xs,
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  chipRow: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.full,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 8,
    backgroundColor: appTheme.colors.white,
  },
  chipActive: {
    borderColor: appTheme.colors.indigo,
    backgroundColor: "rgba(73,98,199,0.1)",
  },
  chipText: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.sm,
  },
  chipTextActive: {
    color: appTheme.colors.indigo,
    fontWeight: appTheme.typography.weight.semibold,
  },
  actionRow: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
  },
  countLabel: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
  },
  card: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.md,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: appTheme.spacing.sm,
  },
  actionBadge: {
    borderRadius: appTheme.radius.sm,
    backgroundColor: "rgba(73,98,199,0.1)",
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 4,
    flexShrink: 1,
  },
  actionBadgeText: {
    color: appTheme.colors.indigo,
    fontSize: appTheme.typography.size.xs,
    fontWeight: appTheme.typography.weight.semibold,
  },
  dateText: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.xs,
  },
  adminText: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.sm,
  },
  targetText: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
  },
  metaText: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.xs,
    fontFamily: "monospace",
    backgroundColor: appTheme.colors.surface ?? "#f8f8f8",
    padding: appTheme.spacing.xs ?? 4,
    borderRadius: appTheme.radius.sm,
  },
  endLabel: {
    textAlign: "center",
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
    paddingVertical: appTheme.spacing.sm,
  },
});
