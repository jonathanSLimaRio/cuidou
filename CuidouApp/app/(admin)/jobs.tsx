import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useToast } from "@/src/hooks/use-toast";
import { adminRepository } from "@/src/lib/api/admin-repository";
import type { AdminJob } from "@/src/lib/types/admin";

type JobDraft = { status: AdminJob["status"]; isVisible: boolean };

const JOB_STATUSES: AdminJob["status"][] = ["OPEN", "PAUSED", "CLOSED", "ARCHIVED"];

function statusColor(status: AdminJob["status"]) {
  if (status === "OPEN") return appTheme.colors.success ?? "#16a34a";
  if (status === "PAUSED") return "#f59e0b";
  if (status === "CLOSED") return appTheme.colors.textMuted;
  return "#dc2626";
}

export default function AdminJobsScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, JobDraft>>({});

  const jobsQuery = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: () => adminRepository.listJobs(),
    select: (data) => {
      setDrafts((prev) => {
        const next = { ...prev };
        for (const job of data.items) {
          if (!next[job.id]) {
            next[job.id] = { status: job.status, isVisible: job.isVisible };
          }
        }
        return next;
      });
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ jobId, status, isVisible }: { jobId: string; status: AdminJob["status"]; isVisible: boolean }) =>
      adminRepository.updateJobStatus(jobId, status, isVisible),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      toast.success("Sucesso", "Vaga atualizada.");
    },
    onError: () => {
      toast.error("Erro", "Não foi possível atualizar a vaga.");
    },
  });

  const jobs = jobsQuery.data?.items ?? [];

  return (
    <ScreenShell title="Vagas" subtitle="Modere status e visibilidade das vagas.">
      {jobsQuery.isPending ? <LoadingBlock label="Carregando vagas..." /> : null}

      {jobsQuery.isError ? (
        <ErrorState
          title="Falha ao carregar"
          description="Não foi possível buscar as vagas."
          onRetry={() => jobsQuery.refetch()}
        />
      ) : null}

      {!jobsQuery.isPending && !jobsQuery.isError && jobs.length === 0 ? (
        <EmptyState title="Nenhuma vaga" description="Nenhuma vaga encontrada." />
      ) : null}

      {jobs.map((job) => {
        const draft = drafts[job.id] ?? { status: job.status, isVisible: job.isVisible };
        return (
          <View key={job.id} style={styles.card}>
            <Text style={styles.title} numberOfLines={2}>{job.title}</Text>
            <Text style={styles.family}>
              Família: {job.family.name ?? job.family.email ?? "-"}
            </Text>
            <View style={styles.statsRow}>
              <Text style={[styles.statusBadge, { color: statusColor(job.status) }]}>
                {job.status}
              </Text>
              <Text style={styles.stat}>{job._count.applications} candidatura(s)</Text>
              {job._count.reports > 0 ? (
                <Text style={[styles.stat, { color: "#dc2626" }]}>
                  {job._count.reports} denúncia(s)
                </Text>
              ) : null}
            </View>

            {/* Status picker */}
            <View style={styles.statusRow}>
              {JOB_STATUSES.map((s) => (
                <Pressable
                  key={s}
                  style={[
                    styles.statusChip,
                    draft.status === s && styles.statusChipActive,
                  ]}
                  onPress={() =>
                    setDrafts((prev) => ({
                      ...prev,
                      [job.id]: { ...draft, status: s },
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      draft.status === s && styles.statusChipTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.visibilityRow}>
              <Text style={styles.visibilityLabel}>Visível no marketplace</Text>
              <Switch
                value={draft.isVisible}
                onValueChange={(val) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [job.id]: { ...draft, isVisible: val },
                  }))
                }
                thumbColor={draft.isVisible ? appTheme.colors.indigo : "#ccc"}
                trackColor={{ false: "#e5e7eb", true: "rgba(73,98,199,0.3)" }}
              />
            </View>

            <Pressable
              style={[styles.saveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
              disabled={updateMutation.isPending}
              onPress={() =>
                updateMutation.mutate({
                  jobId: job.id,
                  status: draft.status,
                  isVisible: draft.isVisible,
                })
              }
            >
              <Text style={styles.saveBtnText}>Salvar</Text>
            </Pressable>
          </View>
        );
      })}
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
    gap: 8,
  },
  title: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.md,
    fontWeight: appTheme.typography.weight.semibold,
  },
  family: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
    alignItems: "center",
    flexWrap: "wrap",
  },
  statusBadge: {
    fontSize: appTheme.typography.size.xs,
    fontWeight: "600",
  },
  stat: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.xs,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  statusChip: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipActive: {
    borderColor: appTheme.colors.indigo,
    backgroundColor: "rgba(73,98,199,0.08)",
  },
  statusChipText: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.xs,
  },
  statusChipTextActive: {
    color: appTheme.colors.indigo,
    fontWeight: "600",
  },
  visibilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  visibilityLabel: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.sm,
  },
  saveBtn: {
    backgroundColor: appTheme.colors.indigo,
    borderRadius: appTheme.radius.full,
    paddingVertical: 10,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    color: "#fff",
    fontSize: appTheme.typography.size.sm,
    fontWeight: "600",
  },
});
