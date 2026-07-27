import { useInfiniteQuery } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { familyRepository } from "@/src/lib/api/family-repository";
import { moneyRange, serviceTypeLabel } from "@/src/lib/marketplace-formatters";
import type { JobStatus } from "@/src/lib/types/marketplace";

const PAGE_SIZE = 20;

const statusFilters: { label: string; value?: JobStatus }[] = [
  { label: "Todas" },
  { label: "Abertas", value: "OPEN" },
  { label: "Pausadas", value: "PAUSED" },
  { label: "Arquivadas", value: "ARCHIVED" },
  { label: "Fechadas", value: "CLOSED" },
];

export default function FamilyJobsScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<JobStatus | undefined>(undefined);

  const jobsQuery = useInfiniteQuery({
    queryKey: ["family-jobs", statusFilter],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      familyRepository.listMyJobs({
        page: pageParam,
        pageSize: PAGE_SIZE,
        status: statusFilter,
      }),
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const items = useMemo(
    () => jobsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [jobsQuery.data?.pages],
  );

  return (
    <ScreenShell
      title="Vagas da familia"
      subtitle="Gerencie criacao, edicao, pausa/reabertura e arquivamento de vagas."
    >
      <Link href="/(family)" asChild>
        <Button label="Voltar ao hub" variant="secondary" />
      </Link>
      <Link href="/(family)/jobs/new" asChild>
        <Button label="Criar nova vaga" testID="family-create-job" />
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
      </View>

      {jobsQuery.isPending ? <LoadingBlock label="Carregando vagas..." /> : null}
      {jobsQuery.isError ? (
        <ErrorState
          title="Falha ao carregar vagas"
          description="Nao foi possivel listar suas vagas."
          onRetry={() => jobsQuery.refetch()}
        />
      ) : null}
      {!jobsQuery.isPending && !jobsQuery.isError && items.length === 0 ? (
        <EmptyState
          title="Sem vagas neste filtro"
          description="Crie uma vaga nova ou altere o filtro para visualizar outras vagas."
        />
      ) : null}

      {!jobsQuery.isPending && !jobsQuery.isError && items.length > 0 ? (
        <View style={styles.list}>
          {items.map((job) => (
            <View key={job.id} style={styles.card}>
              <Text style={styles.cardTitle}>{job.title}</Text>
              <Text style={styles.meta}>
                {serviceTypeLabel(job.serviceType)} - {job.city}/{job.state}
              </Text>
              <Text style={styles.meta}>
                Status: {job.status} - {job._count?.applications ?? 0} candidatura(s)
              </Text>
              <Text style={styles.meta}>{moneyRange(job.hourlyRateMin, job.hourlyRateMax)}</Text>
              <Text style={styles.body} numberOfLines={3}>
                {job.description}
              </Text>
              <View style={styles.cardActions}>
                <Link href={`/(family)/jobs/${job.id}/edit`} asChild>
                  <Button label="Editar vaga" variant="secondary" />
                </Link>
                {job.status === "OPEN" ? (
                  <Button
                    label="Convidar profissionais"
                    onPress={() => router.push(`/(family)/jobs/${job.id}/invite`)}
                  />
                ) : null}
              </View>
            </View>
          ))}

          {jobsQuery.hasNextPage ? (
            <Button
              label="Carregar mais"
              onPress={() => jobsQuery.fetchNextPage()}
              loading={jobsQuery.isFetchingNextPage}
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
    fontSize: appTheme.typography.size.lg,
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
  cardActions: {
    gap: appTheme.spacing.sm,
    marginTop: 4,
  },
});
