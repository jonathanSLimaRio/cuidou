import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useToast } from "@/src/hooks/use-toast";
import { adminRepository } from "@/src/lib/api/admin-repository";
import type { AdminUser } from "@/src/lib/types/admin";
import { Pressable } from "react-native";

function statusColor(status: AdminUser["status"]) {
  if (status === "ACTIVE") return appTheme.colors.success ?? "#16a34a";
  if (status === "SUSPENDED") return "#f59e0b";
  if (status === "BANNED") return appTheme.colors.danger ?? "#dc2626";
  return appTheme.colors.textMuted;
}

export default function PendingUsersScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["admin-pending-users"],
    queryFn: () => adminRepository.listPendingUsers(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: AdminUser["status"] }) =>
      adminRepository.updateUserStatus(userId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-pending-users"] });
      toast.success("Sucesso", "Status do usuário atualizado.");
    },
    onError: () => {
      toast.error("Erro", "Não foi possível atualizar o status.");
    },
  });

  const users = usersQuery.data?.items ?? [];

  return (
    <ScreenShell title="Usuários pendentes" subtitle="Aprovar ou suspender contas pendentes.">
      {usersQuery.isPending ? <LoadingBlock label="Carregando usuários..." /> : null}

      {usersQuery.isError ? (
        <ErrorState
          title="Falha ao carregar"
          description="Não foi possível buscar os usuários pendentes."
          onRetry={() => usersQuery.refetch()}
        />
      ) : null}

      {!usersQuery.isPending && !usersQuery.isError && users.length === 0 ? (
        <EmptyState
          title="Nenhum usuário pendente"
          description="Todos os usuários foram processados."
        />
      ) : null}

      {users.map((u) => (
        <View key={u.id} style={styles.card}>
          <Text style={styles.name}>{u.name ?? "Sem nome"}</Text>
          <Text style={styles.email}>{u.email ?? "-"}</Text>
          <View style={styles.row}>
            <Text style={[styles.statusBadge, { color: statusColor(u.status) }]}>
              {u.status}
            </Text>
            <Text style={styles.role}>{u.role}</Text>
            <Text style={styles.date}>
              {new Date(u.createdAt).toLocaleDateString("pt-BR")}
            </Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, styles.approveBtn]}
              disabled={statusMutation.isPending}
              onPress={() => statusMutation.mutate({ userId: u.id, status: "ACTIVE" })}
            >
              <Text style={styles.actionBtnText}>Aprovar</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.suspendBtn]}
              disabled={statusMutation.isPending}
              onPress={() => statusMutation.mutate({ userId: u.id, status: "SUSPENDED" })}
            >
              <Text style={styles.actionBtnText}>Suspender</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.md,
    gap: 6,
  },
  name: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.md,
    fontWeight: appTheme.typography.weight.semibold,
  },
  email: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
  },
  row: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
    alignItems: "center",
    flexWrap: "wrap",
  },
  statusBadge: {
    fontSize: appTheme.typography.size.xs,
    fontWeight: "600",
  },
  role: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.xs,
  },
  date: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.xs,
  },
  actions: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: appTheme.radius.full,
    alignItems: "center",
  },
  approveBtn: {
    backgroundColor: appTheme.colors.indigo,
  },
  suspendBtn: {
    backgroundColor: "#f59e0b",
  },
  actionBtnText: {
    color: "#fff",
    fontSize: appTheme.typography.size.sm,
    fontWeight: "600",
  },
});
