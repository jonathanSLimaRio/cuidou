import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useToast } from "@/src/hooks/use-toast";
import { adminRepository } from "@/src/lib/api/admin-repository";
import type { AdminReport } from "@/src/lib/types/admin";

function statusColor(status: AdminReport["status"]) {
  if (status === "RESOLVED") return appTheme.colors.success ?? "#16a34a";
  if (status === "DISMISSED") return appTheme.colors.textMuted;
  if (status === "IN_REVIEW") return appTheme.colors.indigo;
  return "#f59e0b";
}

export default function ReportsScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const reportsQuery = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => adminRepository.listOpenReports(),
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      reportId,
      status,
      resolutionNotes,
    }: {
      reportId: string;
      status: "RESOLVED" | "DISMISSED";
      resolutionNotes?: string;
    }) => adminRepository.resolveReport(reportId, status, resolutionNotes),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success(
        "Sucesso",
        vars.status === "RESOLVED" ? "Denúncia resolvida." : "Denúncia descartada.",
      );
    },
    onError: () => {
      toast.error("Erro", "Não foi possível processar a denúncia.");
    },
  });

  const reports = reportsQuery.data?.items ?? [];
  const openReports = reports.filter(
    (r) => r.status === "OPEN" || r.status === "IN_REVIEW",
  );

  return (
    <ScreenShell title="Denúncias" subtitle="Resolva ou descarte denúncias abertas.">
      {reportsQuery.isPending ? <LoadingBlock label="Carregando denúncias..." /> : null}

      {reportsQuery.isError ? (
        <ErrorState
          title="Falha ao carregar"
          description="Não foi possível buscar as denúncias."
          onRetry={() => reportsQuery.refetch()}
        />
      ) : null}

      {!reportsQuery.isPending && !reportsQuery.isError && openReports.length === 0 ? (
        <EmptyState
          title="Nenhuma denúncia pendente"
          description="Todas as denúncias foram processadas."
        />
      ) : null}

      {openReports.map((report) => (
        <View key={report.id} style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={[styles.statusBadge, { color: statusColor(report.status) }]}>
              {report.status}
            </Text>
            <Text style={styles.targetType}>{report.targetType}</Text>
          </View>
          <Text style={styles.reason}>{report.reason}</Text>
          {report.details ? (
            <Text style={styles.details}>{report.details}</Text>
          ) : null}
          <Text style={styles.reporter}>
            Reporter: {report.reporter.name ?? report.reporter.email ?? "Usuário"} •{" "}
            {new Date(report.createdAt).toLocaleDateString("pt-BR")}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Notas de resolução (opcional)"
            placeholderTextColor={appTheme.colors.textMuted}
            value={notesById[report.id] ?? ""}
            onChangeText={(text) => setNotesById((prev) => ({ ...prev, [report.id]: text }))}
            multiline
          />
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, styles.resolveBtn]}
              disabled={resolveMutation.isPending}
              onPress={() =>
                resolveMutation.mutate({
                  reportId: report.id,
                  status: "RESOLVED",
                  resolutionNotes: notesById[report.id]?.trim() || undefined,
                })
              }
            >
              <Text style={styles.actionBtnText}>Resolver</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.dismissBtn]}
              disabled={resolveMutation.isPending}
              onPress={() =>
                resolveMutation.mutate({
                  reportId: report.id,
                  status: "DISMISSED",
                  resolutionNotes: notesById[report.id]?.trim() || undefined,
                })
              }
            >
              <Text style={styles.actionBtnText}>Descartar</Text>
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
  headerRow: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
    alignItems: "center",
  },
  statusBadge: {
    fontSize: appTheme.typography.size.xs,
    fontWeight: "600",
  },
  targetType: {
    color: appTheme.colors.indigo,
    fontSize: appTheme.typography.size.xs,
    fontWeight: "600",
  },
  reason: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.sm,
    fontWeight: appTheme.typography.weight.semibold,
  },
  details: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.sm,
  },
  reporter: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.sm,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 8,
    fontSize: appTheme.typography.size.sm,
    color: appTheme.colors.navy,
    minHeight: 60,
    marginTop: 4,
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
  resolveBtn: { backgroundColor: appTheme.colors.indigo },
  dismissBtn: { backgroundColor: appTheme.colors.textMuted },
  actionBtnText: {
    color: "#fff",
    fontSize: appTheme.typography.size.sm,
    fontWeight: "600",
  },
});
