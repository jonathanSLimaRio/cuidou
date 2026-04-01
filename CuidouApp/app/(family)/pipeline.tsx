import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useToast } from "@/src/hooks/use-toast";
import { ApiClientError } from "@/src/lib/api/client";
import { familyRepository } from "@/src/lib/api/family-repository";
import { applicationStatusLabel } from "@/src/lib/family-formatters";
import { serviceTypeLabel, verificationLabel } from "@/src/lib/marketplace-formatters";
import type { ApplicationStatus } from "@/src/lib/types/family";

const PAGE_SIZE = 20;

const statusFilters: { label: string; value?: ApplicationStatus }[] = [
  { label: "Todas" },
  { label: "Enviadas", value: "SUBMITTED" },
  { label: "Pre-selecionadas", value: "SHORTLISTED" },
  { label: "Aceitas", value: "ACCEPTED" },
  { label: "Recusadas", value: "REJECTED" },
  { label: "Retiradas", value: "WITHDRAWN" },
];

function getErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return "Nao foi possivel concluir esta acao.";
}

export default function FamilyPipelineScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | undefined>(undefined);
  const [jobFilter, setJobFilter] = useState<string | undefined>(undefined);
  const [busyById, setBusyById] = useState<Record<string, string>>({});

  const jobsQuery = useQuery({
    queryKey: ["family-jobs-options"],
    queryFn: () => familyRepository.listMyJobs({ page: 1, pageSize: 100 }),
  });

  const applicationsQuery = useInfiniteQuery({
    queryKey: ["family-applications", statusFilter, jobFilter],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      familyRepository.listFamilyApplications({
        page: pageParam,
        pageSize: PAGE_SIZE,
        status: statusFilter,
        jobId: jobFilter,
      }),
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const acceptMutation = useMutation({
    mutationFn: (applicationId: string) => familyRepository.acceptApplication(applicationId),
    onSuccess: () => {
      toast.success("Candidatura aceita", "Contrato iniciado com sucesso.");
      void applicationsQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ["family-contracts"] });
    },
    onError: (error) => {
      toast.error("Falha ao aceitar", getErrorMessage(error));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (input: { applicationId: string; favorite: boolean }) =>
      familyRepository.rejectApplication(input.applicationId, input.favorite),
    onSuccess: () => {
      toast.success("Candidatura recusada", "Status atualizado.");
      void applicationsQuery.refetch();
    },
    onError: (error) => {
      toast.error("Falha ao recusar", getErrorMessage(error));
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: (input: { applicationId: string; favorite: boolean }) =>
      familyRepository.favoriteApplication(input.applicationId, input.favorite),
    onSuccess: () => {
      void applicationsQuery.refetch();
    },
    onError: (error) => {
      toast.error("Falha ao favoritar", getErrorMessage(error));
    },
  });

  const items = useMemo(
    () => applicationsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [applicationsQuery.data?.pages],
  );

  const pendingJobOptions = jobsQuery.data?.items ?? [];

  const runWithBusy = async (id: string, action: string, runner: () => Promise<unknown>) => {
    setBusyById((current) => ({ ...current, [id]: action }));
    try {
      await runner();
    } finally {
      setBusyById((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }
  };

  return (
    <ScreenShell
      title="Pipeline de candidaturas"
      subtitle="Aprove, recuse e favorite candidaturas por vaga e status."
    >
      <Link href="/(family)" asChild>
        <Button label="Voltar ao hub" variant="secondary" />
      </Link>

      <View style={styles.panel}>
        <Text style={styles.heading}>Filtro de status</Text>
        <View style={styles.row}>
          {statusFilters.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => setStatusFilter(item.value)}
              style={[styles.chip, statusFilter === item.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, statusFilter === item.value && styles.chipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.heading}>Filtro por vaga</Text>
        <View style={styles.row}>
          <Pressable
            onPress={() => setJobFilter(undefined)}
            style={[styles.chip, !jobFilter && styles.chipActive]}
          >
            <Text style={[styles.chipText, !jobFilter && styles.chipTextActive]}>Todas</Text>
          </Pressable>
          {pendingJobOptions.map((job) => (
            <Pressable
              key={job.id}
              onPress={() => setJobFilter(job.id)}
              style={[styles.chip, jobFilter === job.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, jobFilter === job.id && styles.chipTextActive]}>
                {job.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {applicationsQuery.isPending ? <LoadingBlock label="Carregando candidaturas..." /> : null}
      {applicationsQuery.isError ? (
        <ErrorState
          title="Falha ao carregar pipeline"
          description="Nao foi possivel listar as candidaturas."
          onRetry={() => applicationsQuery.refetch()}
        />
      ) : null}
      {!applicationsQuery.isPending && !applicationsQuery.isError && items.length === 0 ? (
        <EmptyState
          title="Sem candidaturas neste filtro"
          description="Ajuste os filtros ou aguarde novas candidaturas."
        />
      ) : null}

      {!applicationsQuery.isPending && !applicationsQuery.isError && items.length > 0 ? (
        <View style={styles.list}>
          {items.map((application) => {
            const canDecide =
              application.status === "SUBMITTED" || application.status === "SHORTLISTED";
            const busyAction = busyById[application.id];
            const isBusy = Boolean(busyAction);

            return (
              <View key={application.id} style={styles.card}>
                <Text style={styles.cardTitle}>{application.job.title}</Text>
                <Text style={styles.meta}>
                  {serviceTypeLabel(application.job.serviceType)} - {application.job.city}/
                  {application.job.state}
                </Text>
                <Text style={styles.meta}>
                  Profissional: {application.professional.name ?? application.professional.email ?? "-"}
                </Text>
                <Text style={styles.meta}>
                  Status: {applicationStatusLabel(application.status)}
                  {application.fromInvitation ? " (via convite)" : ""}
                </Text>
                <Text style={styles.meta}>
                  Verificacao:{" "}
                  {verificationLabel(
                    application.professional.professionalProfile?.verificationStatus ?? "NOT_SUBMITTED",
                  )}
                </Text>
                {application.coverMessage ? (
                  <Text style={styles.body} numberOfLines={4}>
                    {application.coverMessage}
                  </Text>
                ) : null}

                <View style={styles.actionRow}>
                  {canDecide ? (
                    <>
                      <Button
                        label="Aceitar"
                        onPress={() =>
                          void runWithBusy(application.id, "accept", async () => {
                            await acceptMutation.mutateAsync(application.id);
                          })
                        }
                        loading={busyAction === "accept"}
                        disabled={isBusy && busyAction !== "accept"}
                      />
                      <Button
                        label="Recusar"
                        variant="secondary"
                        onPress={() =>
                          void runWithBusy(application.id, "reject", async () => {
                            await rejectMutation.mutateAsync({
                              applicationId: application.id,
                              favorite: application.isFavoriteByFamily,
                            });
                          })
                        }
                        loading={busyAction === "reject"}
                        disabled={isBusy && busyAction !== "reject"}
                      />
                    </>
                  ) : null}

                  <Button
                    label={application.isFavoriteByFamily ? "Desfavoritar" : "Favoritar"}
                    variant="ghost"
                    onPress={() =>
                      void runWithBusy(application.id, "favorite", async () => {
                        await favoriteMutation.mutateAsync({
                          applicationId: application.id,
                          favorite: !application.isFavoriteByFamily,
                        });
                      })
                    }
                    loading={busyAction === "favorite"}
                    disabled={isBusy && busyAction !== "favorite"}
                  />
                </View>
              </View>
            );
          })}

          {applicationsQuery.hasNextPage ? (
            <Button
              label="Carregar mais"
              onPress={() => applicationsQuery.fetchNextPage()}
              loading={applicationsQuery.isFetchingNextPage}
            />
          ) : (
            <Text style={styles.meta}>Fim da lista.</Text>
          )}
        </View>
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
  heading: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.md,
    fontWeight: appTheme.typography.weight.semibold,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appTheme.spacing.sm,
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
  list: {
    gap: appTheme.spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.md,
    gap: 6,
  },
  cardTitle: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.lg,
    fontWeight: appTheme.typography.weight.semibold,
  },
  body: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.sm,
    lineHeight: 20,
  },
  meta: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.xs,
  },
});
