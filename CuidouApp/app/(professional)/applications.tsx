import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { professionalRepository } from "@/src/lib/api/professional-repository";
import { applicationStatusLabel } from "@/src/lib/professional-formatters";
import type { ApplicationStatus } from "@/src/lib/types/professional";

const PAGE_SIZE = 20;

const statusFilters: { label: string; value?: ApplicationStatus }[] = [
  { label: "Todas" },
  { label: "Enviadas", value: "SUBMITTED" },
  { label: "Pré-selecionadas", value: "SHORTLISTED" },
  { label: "Aceitas", value: "ACCEPTED" },
  { label: "Recusadas", value: "REJECTED" },
  { label: "Retiradas", value: "WITHDRAWN" },
];

export default function ProfessionalApplicationsScreen() {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | undefined>(undefined);

  const applicationsQuery = useInfiniteQuery({
    queryKey: ["professional-applications", statusFilter],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      professionalRepository.listApplications({
        page: pageParam,
        pageSize: PAGE_SIZE,
        status: statusFilter,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  const items = useMemo(
    () => applicationsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [applicationsQuery.data?.pages],
  );

  return (
    <ScreenShell
      title="Candidaturas enviadas"
      subtitle="Acompanhe todas as suas candidaturas por status."
    >
      <Link href="/(professional)" asChild>
        <Button label="Voltar ao hub" variant="secondary" />
      </Link>

      <View style={styles.panel}>
        <Text style={styles.heading}>Filtro de status</Text>
        <View style={styles.row}>
          {statusFilters.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => setStatusFilter(item.value)}
              style={[
                styles.chip,
                statusFilter === item.value && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  statusFilter === item.value && styles.chipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {applicationsQuery.isPending ? <LoadingBlock label="Carregando candidaturas..." /> : null}
      {applicationsQuery.isError ? (
        <ErrorState
          title="Falha ao carregar candidaturas"
          description="Não foi possível buscar suas candidaturas."
          onRetry={() => applicationsQuery.refetch()}
        />
      ) : null}

      {!applicationsQuery.isPending && !applicationsQuery.isError && items.length === 0 ? (
        <EmptyState
          title="Nenhuma candidatura"
          description="Você ainda não enviou candidaturas neste filtro."
        />
      ) : null}

      {!applicationsQuery.isPending && !applicationsQuery.isError && items.length > 0 ? (
        <View style={styles.list}>
          {items.map((application) => (
            <View key={application.id} style={styles.card}>
              <Text style={styles.cardTitle}>{application.job.title}</Text>
              <Text style={styles.meta}>
                {application.job.city}/{application.job.state}
              </Text>
              <Text style={styles.meta}>
                Status: {applicationStatusLabel(application.status)}
              </Text>
              <Text style={styles.meta}>
                Enviada em {new Date(application.createdAt).toLocaleDateString("pt-BR")}
              </Text>
              {application.coverMessage ? (
                <Text style={styles.body} numberOfLines={4}>
                  {application.coverMessage}
                </Text>
              ) : null}
              <Link href={`/(marketplace)/jobs/${application.job.id}`} asChild>
                <Button label="Ver vaga" variant="ghost" />
              </Link>
            </View>
          ))}

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

      <Link href="/(marketplace)/jobs" asChild>
        <Button label="Buscar vagas no marketplace" />
      </Link>
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
  meta: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
  },
  body: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.sm,
    lineHeight: 20,
  },
});
