import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { marketplaceRepository } from "@/src/lib/api/marketplace-repository";
import {
  moneyRange,
  serviceTypeLabel,
} from "@/src/lib/marketplace-formatters";
import type { JobsFilter, ServiceType } from "@/src/lib/types/marketplace";

const PAGE_SIZE = 20;

function ServiceTypeFilter({
  value,
  onChange,
}: {
  value: ServiceType | "";
  onChange: (next: ServiceType | "") => void;
}) {
  const options: { label: string; value: ServiceType | "" }[] = [
    { label: "Todos", value: "" },
    { label: "Babá", value: "BABYSITTER" },
    { label: "Cuidados idosos", value: "ELDER_CAREGIVER" },
  ];

  return (
    <View style={styles.filterRow}>
      {options.map((option) => (
        <Pressable
          key={option.label}
          onPress={() => onChange(option.value)}
          style={[
            styles.filterChip,
            value === option.value && styles.filterChipActive,
          ]}
        >
          <Text
            style={[
              styles.filterChipLabel,
              value === option.value && styles.filterChipLabelActive,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function MarketplaceJobsScreen() {
  const router = useRouter();
  const [draftState, setDraftState] = useState("");
  const [draftCity, setDraftCity] = useState("");
  const [draftServiceType, setDraftServiceType] = useState<ServiceType | "">("");
  const [filters, setFilters] = useState<JobsFilter>({});

  const jobsQuery = useInfiniteQuery({
    queryKey: ["marketplace-jobs", filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      marketplaceRepository.listJobs(filters, pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  const items = useMemo(
    () => jobsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [jobsQuery.data?.pages],
  );

  const onApplyFilters = () => {
    setFilters({
      serviceType: draftServiceType,
      state: draftState.trim(),
      city: draftCity.trim(),
    });
  };

  const onResetFilters = () => {
    setDraftServiceType("");
    setDraftState("");
    setDraftCity("");
    setFilters({});
  };

  return (
    <ScreenShell
      title="Marketplace de vagas"
      subtitle="Explore vagas públicas da Cuidou e filtre por serviço e região."
    >
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Filtros</Text>
        <ServiceTypeFilter value={draftServiceType} onChange={setDraftServiceType} />

        <TextInput
          style={styles.input}
          value={draftState}
          onChangeText={setDraftState}
          placeholder="Estado (ex: SP)"
          placeholderTextColor={appTheme.colors.textMuted}
          autoCapitalize="characters"
          maxLength={2}
        />

        <TextInput
          style={styles.input}
          value={draftCity}
          onChangeText={setDraftCity}
          placeholder="Cidade (ex: São Paulo)"
          placeholderTextColor={appTheme.colors.textMuted}
        />

        <View style={styles.actionRow}>
          <Button label="Aplicar filtros" onPress={onApplyFilters} />
          <Button label="Limpar" variant="secondary" onPress={onResetFilters} />
        </View>
      </View>

      {jobsQuery.isPending ? <LoadingBlock label="Carregando vagas..." /> : null}

      {jobsQuery.isError ? (
        <ErrorState
          title="Falha ao carregar vagas"
          description="Não conseguimos buscar as vagas agora."
          onRetry={() => jobsQuery.refetch()}
        />
      ) : null}

      {!jobsQuery.isPending && !jobsQuery.isError && items.length === 0 ? (
        <EmptyState
          title="Nenhuma vaga encontrada"
          description="Ajuste os filtros ou volte mais tarde para novas oportunidades."
        />
      ) : null}

      {!jobsQuery.isPending && !jobsQuery.isError && items.length > 0 ? (
        <View style={styles.list}>
          {items.map((job, index) => (
            <Pressable
              key={job.id}
              testID={`marketplace-job-card-${index}`}
              onPress={() => router.push(`/(marketplace)/jobs/${job.id}`)}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>{job.title}</Text>
              <Text style={styles.cardMeta}>
                {serviceTypeLabel(job.serviceType)} - {job.city}/{job.state}
              </Text>
              <Text style={styles.cardBody} numberOfLines={3}>
                {job.description}
              </Text>
              <Text style={styles.cardFoot}>
                {moneyRange(job.hourlyRateMin, job.hourlyRateMax)} -{" "}
                {job._count?.applications ?? 0} candidatura(s)
              </Text>
            </Pressable>
          ))}

          {jobsQuery.hasNextPage ? (
            <Button
              label="Carregar mais"
              onPress={() => jobsQuery.fetchNextPage()}
              loading={jobsQuery.isFetchingNextPage}
            />
          ) : (
            <Text style={styles.endLabel}>Você chegou ao fim da lista.</Text>
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
  panelTitle: {
    fontSize: appTheme.typography.size.lg,
    fontWeight: appTheme.typography.weight.semibold,
    color: appTheme.colors.navy,
  },
  filterRow: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
    flexWrap: "wrap",
  },
  filterChip: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.full,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 8,
    backgroundColor: appTheme.colors.white,
  },
  filterChipActive: {
    borderColor: appTheme.colors.indigo,
    backgroundColor: "rgba(73,98,199,0.1)",
  },
  filterChipLabel: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.sm,
  },
  filterChipLabelActive: {
    color: appTheme.colors.indigo,
    fontWeight: appTheme.typography.weight.semibold,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    color: appTheme.colors.textStrong,
    paddingHorizontal: appTheme.spacing.md,
    fontSize: appTheme.typography.size.md,
  },
  actionRow: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
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
  cardMeta: {
    color: appTheme.colors.indigo,
    fontSize: appTheme.typography.size.sm,
  },
  cardBody: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.sm,
    lineHeight: 20,
  },
  cardFoot: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
  },
  endLabel: {
    textAlign: "center",
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
    paddingVertical: appTheme.spacing.sm,
  },
});
