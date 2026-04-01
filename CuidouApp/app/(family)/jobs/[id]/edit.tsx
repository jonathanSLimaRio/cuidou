import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { FamilyJobForm } from "@/src/components/family/job-form";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useToast } from "@/src/hooks/use-toast";
import { ApiClientError } from "@/src/lib/api/client";
import { familyRepository } from "@/src/lib/api/family-repository";
import type { FamilyJob, FamilyJobPayload } from "@/src/lib/types/family";

function getErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return "Nao foi possivel atualizar a vaga.";
}

function jobToPayload(job: FamilyJob, overrideStatus?: FamilyJob["status"]): FamilyJobPayload {
  return {
    serviceType: job.serviceType,
    title: job.title,
    description: job.description,
    state: job.state,
    city: job.city,
    neighborhood: job.neighborhood ?? undefined,
    hourlyRateMin: job.hourlyRateMin ?? undefined,
    hourlyRateMax: job.hourlyRateMax ?? undefined,
    scheduleDetails: job.scheduleDetails ?? undefined,
    scheduleSlots: job.scheduleSlots,
    status: overrideStatus ?? job.status,
  };
}

export default function FamilyJobEditScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();

  const jobsQuery = useQuery({
    queryKey: ["family-jobs-edit", id],
    queryFn: () => familyRepository.listMyJobs({ page: 1, pageSize: 200 }),
    enabled: Boolean(id),
  });

  const job = useMemo(() => jobsQuery.data?.items.find((item) => item.id === id) ?? null, [id, jobsQuery.data?.items]);

  const updateMutation = useMutation({
    mutationFn: (payload: FamilyJobPayload) => familyRepository.updateJob(id, payload),
    onSuccess: () => {
      toast.success("Vaga atualizada", "Os dados da vaga foram salvos.");
      void jobsQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ["family-jobs"] });
    },
    onError: (error) => {
      toast.error("Falha ao atualizar vaga", getErrorMessage(error));
    },
  });

  const statusMutation = useMutation({
    mutationFn: (nextStatus: FamilyJob["status"]) => {
      if (!job) {
        throw new Error("job_not_found");
      }
      return familyRepository.updateJob(id, jobToPayload(job, nextStatus));
    },
    onSuccess: (_, nextStatus) => {
      toast.success("Status atualizado", `Vaga atualizada para ${nextStatus}.`);
      void jobsQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ["family-jobs"] });
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "job_not_found") {
        toast.error("Vaga indisponivel", "Nao foi possivel localizar a vaga.");
        return;
      }
      toast.error("Falha ao atualizar status", getErrorMessage(error));
    },
  });

  return (
    <ScreenShell title="Editar vaga" subtitle="Atualize informacoes, agenda e status da vaga.">
      <Button label="Voltar para vagas" variant="secondary" onPress={() => router.replace("/(family)/jobs")} />

      {jobsQuery.isPending ? <LoadingBlock label="Carregando vaga..." /> : null}
      {jobsQuery.isError ? (
        <ErrorState
          title="Falha ao carregar vaga"
          description="Nao foi possivel carregar os dados para edicao."
          onRetry={() => jobsQuery.refetch()}
        />
      ) : null}

      {!jobsQuery.isPending && !jobsQuery.isError && !job ? (
        <EmptyState
          title="Vaga nao encontrada"
          description="A vaga solicitada nao foi encontrada na sua conta."
        />
      ) : null}

      {!jobsQuery.isPending && !jobsQuery.isError && job ? (
        <>
          <FamilyJobForm
            key={job.id}
            mode="edit"
            submitLabel="Salvar vaga"
            loading={updateMutation.isPending}
            initialValue={jobToPayload(job, job.status)}
            onSubmit={(payload) => updateMutation.mutate(payload)}
          />

          <View style={styles.actions}>
            <Button
              label="Pausar vaga"
              variant="secondary"
              loading={statusMutation.isPending}
              onPress={() => statusMutation.mutate("PAUSED")}
            />
            <Button
              label="Reabrir vaga"
              variant="secondary"
              loading={statusMutation.isPending}
              onPress={() => statusMutation.mutate("OPEN")}
            />
            <Button
              label="Arquivar vaga"
              variant="ghost"
              loading={statusMutation.isPending}
              onPress={() => statusMutation.mutate("ARCHIVED")}
            />
          </View>
        </>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  actions: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.sm,
  },
});

