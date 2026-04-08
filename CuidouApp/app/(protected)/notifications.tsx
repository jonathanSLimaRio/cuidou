import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useAuth } from "@/src/hooks/use-auth";
import { useToast } from "@/src/hooks/use-toast";
import { familyRepository } from "@/src/lib/api/family-repository";
import { professionalRepository } from "@/src/lib/api/professional-repository";
import {
  normalizeNotificationPayload,
  resolveNotificationNavigationTarget,
  type NotificationRoutingRole,
} from "@/src/navigation/notification-routing";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  createdAt: string;
  readAt: string | null;
  data: Record<string, string> | null;
};

function resolveDeepLink(
  item: Pick<NotificationItem, "type" | "data">,
  role: NotificationRoutingRole | undefined,
): string | null {
  const payload = normalizeNotificationPayload({
    ...(item.data ?? {}),
    notificationType: item.type,
  });

  return resolveNotificationNavigationTarget(payload, role);
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const repo = user?.role === "PROFESSIONAL" ? professionalRepository : familyRepository;

  const notificationsQuery = useQuery({
    queryKey: ["notifications", user?.role, unreadOnly, page],
    queryFn: () => repo.getNotifications({ page, unreadOnly }),
    enabled: Boolean(user),
  });

  const markAllMutation = useMutation({
    mutationFn: () => repo.markAllNotificationsRead(),
    onSuccess: () => {
      toast.success("Pronto", "Todas as notificacoes marcadas como lidas.");
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast.error("Erro", "Nao foi possivel marcar notificacoes como lidas.");
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => repo.markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const items: NotificationItem[] = notificationsQuery.data?.items ?? [];
  const totalPages = notificationsQuery.data?.totalPages ?? 1;

  async function handleItemPress(item: NotificationItem) {
    if (!item.readAt) {
      await markOneMutation.mutateAsync(item.id);
    }
    const link = resolveDeepLink(item, user?.role ?? undefined);
    if (link) {
      router.push(link as never);
    }
  }

  return (
    <ScreenShell title="Notificacoes" subtitle="Acompanhe atividades e alertas da plataforma.">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={notificationsQuery.isFetching}
            onRefresh={() => notificationsQuery.refetch()}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.filterRow}>
            <Pressable
              style={[styles.filterChip, !unreadOnly && styles.filterChipActive]}
              onPress={() => { setUnreadOnly(false); setPage(1); }}
            >
              <Text style={[styles.filterChipText, !unreadOnly && styles.filterChipTextActive]}>
                Todas
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterChip, unreadOnly && styles.filterChipActive]}
              onPress={() => { setUnreadOnly(true); setPage(1); }}
            >
              <Text style={[styles.filterChipText, unreadOnly && styles.filterChipTextActive]}>
                Nao lidas
              </Text>
            </Pressable>
          </View>
          <Button
            label="Marcar todas como lidas"
            variant="secondary"
            loading={markAllMutation.isPending}
            disabled={markAllMutation.isPending}
            onPress={() => markAllMutation.mutate()}
          />
        </View>

        {notificationsQuery.isPending ? (
          <LoadingBlock label="Carregando notificacoes..." />
        ) : notificationsQuery.isError ? (
          <ErrorState
            title="Falha ao carregar"
            description="Nao foi possivel buscar notificacoes."
            onRetry={() => notificationsQuery.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Sem notificacoes"
            description="Nenhuma notificacao encontrada para este filtro."
          />
        ) : (
          <View style={styles.list}>
            {items.map((item) => {
              const isUnread = item.readAt === null;
              const hasDeepLink = Boolean(resolveDeepLink(item, user?.role ?? undefined));

              return (
                <Pressable
                  key={item.id}
                  style={[styles.card, isUnread && styles.cardUnread]}
                  onPress={() => void handleItemPress(item)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardType}>{item.type}</Text>
                    {isUnread && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {item.body ? <Text style={styles.cardBody}>{item.body}</Text> : null}
                  <Text style={styles.cardDate}>
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                    {hasDeepLink ? " • Toque para abrir" : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {totalPages > 1 ? (
          <View style={styles.paginationRow}>
            <Button
              label="Anterior"
              variant="secondary"
              disabled={page <= 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
            />
            <Text style={styles.pageLabel}>
              {page} / {totalPages}
            </Text>
            <Button
              label="Proxima"
              variant="secondary"
              disabled={page >= totalPages}
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </View>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: { gap: appTheme.spacing.sm, marginBottom: appTheme.spacing.md },
  filterRow: { flexDirection: "row", gap: appTheme.spacing.sm },
  filterChip: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.full,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 8,
    backgroundColor: appTheme.colors.white,
  },
  filterChipActive: { borderColor: appTheme.colors.indigo, backgroundColor: "rgba(73,98,199,0.1)" },
  filterChipText: { color: appTheme.colors.text, fontSize: appTheme.typography.size.sm },
  filterChipTextActive: { color: appTheme.colors.indigo, fontWeight: appTheme.typography.weight.semibold },
  list: { gap: appTheme.spacing.sm },
  card: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.md,
    gap: 4,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: appTheme.colors.indigo,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardType: {
    fontSize: appTheme.typography.size.xs,
    color: appTheme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: appTheme.colors.indigo,
  },
  cardTitle: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.md,
    fontWeight: appTheme.typography.weight.semibold,
  },
  cardBody: { color: appTheme.colors.textMuted, fontSize: appTheme.typography.size.sm },
  cardDate: { color: appTheme.colors.textMuted, fontSize: appTheme.typography.size.xs, marginTop: 2 },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: appTheme.spacing.md,
    marginTop: appTheme.spacing.md,
  },
  pageLabel: { color: appTheme.colors.textMuted, fontSize: appTheme.typography.size.sm },
});
