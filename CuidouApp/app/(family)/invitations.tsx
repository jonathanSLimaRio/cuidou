import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
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
import { invitationStatusLabel } from "@/src/lib/family-formatters";
import { serviceTypeLabel } from "@/src/lib/marketplace-formatters";
import type { JobInvitationStatus } from "@/src/lib/types/family";

const PAGE_SIZE = 20;

const statusFilters: { label: string; value?: JobInvitationStatus }[] = [
  { label: "Todos" },
  { label: "Pendentes", value: "PENDING" },
  { label: "Aceitos", value: "ACCEPTED" },
  { label: "Recusados", value: "DECLINED" },
  { label: "Expirados", value: "EXPIRED" },
  { label: "Cancelados", value: "CANCELED" },
];

function getErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return "Nao foi possivel concluir esta acao.";
}

export default function FamilyInvitationsScreen() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<JobInvitationStatus | undefined>(undefined);
  const [jobFilter, setJobFilter] = useState<string | undefined>(undefined);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const jobsQuery = useQuery({
    queryKey: ["family-jobs-options-for-invitations"],
    queryFn: () => familyRepository.listMyJobs({ page: 1, pageSize: 100 }),
  });

  const invitationsQuery = useInfiniteQuery({
    queryKey: ["family-invitations", statusFilter, jobFilter],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      familyRepository.listFamilyInvitations({
        page: pageParam,
        pageSize: PAGE_SIZE,
        status: statusFilter,
        jobId: jobFilter,
      }),
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const cancelMutation = useMutation({
    mutationFn: (invitationId: string) => familyRepository.cancelInvitation(invitationId),
    onSuccess: () => {
      toast.success("Convite cancelado", "Status atualizado com sucesso.");
      void invitationsQuery.refetch();
    },
    onError: (error) => {
      toast.error("Falha ao cancelar convite", getErrorMessage(error));
    },
  });

  const items = useMemo(
    () => invitationsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [invitationsQuery.data?.pages],
  );

  const jobs = jobsQuery.data?.items ?? [];

  const onCancel = async (invitationId: string) => {
    setCancelingId(invitationId);
    try {
      await cancelMutation.mutateAsync(invitationId);
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <ScreenShell
      title="Convites enviados"
      subtitle="Acompanhe respostas e cancele convites pendentes."
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
          {jobs.map((job) => (
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

      {invitationsQuery.isPending ? <LoadingBlock label="Carregando convites..." /> : null}
      {invitationsQuery.isError ? (
        <ErrorState
          title="Falha ao carregar convites"
          description="Nao foi possivel listar convites enviados."
          onRetry={() => invitationsQuery.refetch()}
        />
      ) : null}
      {!invitationsQuery.isPending && !invitationsQuery.isError && items.length === 0 ? (
        <EmptyState
          title="Sem convites neste filtro"
          description="Envie convites no detalhe de profissionais do marketplace."
        />
      ) : null}

      {!invitationsQuery.isPending && !invitationsQuery.isError && items.length > 0 ? (
        <View style={styles.list}>
          {items.map((invitation) => (
            <View key={invitation.id} style={styles.card}>
              <Text style={styles.cardTitle}>{invitation.job.title}</Text>
              <Text style={styles.meta}>
                {serviceTypeLabel(invitation.job.serviceType)} - {invitation.job.city}/
                {invitation.job.state}
              </Text>
              <Text style={styles.meta}>
                Profissional: {invitation.professional.name ?? invitation.professional.email ?? "-"}
              </Text>
              <Text style={styles.meta}>Status: {invitationStatusLabel(invitation.status)}</Text>
              <Text style={styles.meta}>
                Expira em {new Date(invitation.expiresAt).toLocaleDateString("pt-BR")}
              </Text>
              {invitation.message ? <Text style={styles.body}>Mensagem: {invitation.message}</Text> : null}
              {invitation.responseMessage ? (
                <Text style={styles.body}>Resposta: {invitation.responseMessage}</Text>
              ) : null}

              {invitation.status === "PENDING" ? (
                <Button
                  label="Cancelar convite"
                  variant="secondary"
                  onPress={() => void onCancel(invitation.id)}
                  loading={cancelingId === invitation.id}
                />
              ) : null}
            </View>
          ))}

          {invitationsQuery.hasNextPage ? (
            <Button
              label="Carregar mais"
              onPress={() => invitationsQuery.fetchNextPage()}
              loading={invitationsQuery.isFetchingNextPage}
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
});

