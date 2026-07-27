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
  verificationLabel,
} from "@/src/lib/marketplace-formatters";
import type { ProfessionalsFilter, ServiceType } from "@/src/lib/types/marketplace";

const PAGE_SIZE = 20;

function ServiceTypeFilter({
  value,
  onChange,
}: {
  value: ServiceType | "";
  onChange: (next: ServiceType | "") => void;
}) {
  const options: { label: string; value: ServiceType | "" }[] = [
    { label: "Todas", value: "" },
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

export default function MarketplaceProfessionalsScreen() {
  const router = useRouter();
  const [draftState, setDraftState] = useState("");
  const [draftCity, setDraftCity] = useState("");
  const [draftServiceType, setDraftServiceType] = useState<ServiceType | "">("");
  const [filters, setFilters] = useState<ProfessionalsFilter>({ verifiedOnly: true });

  const professionalsQuery = useInfiniteQuery({
    queryKey: ["marketplace-professionals", filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      marketplaceRepository.listProfessionals(filters, pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  const items = useMemo(
    () => professionalsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [professionalsQuery.data?.pages],
  );

  const onApplyFilters = () => {
    setFilters({
      serviceType: draftServiceType,
      state: draftState.trim(),
      city: draftCity.trim(),
      verifiedOnly: true,
    });
  };

  const onResetFilters = () => {
    setDraftServiceType("");
    setDraftState("");
    setDraftCity("");
    setFilters({ verifiedOnly: true });
  };

  return (
    <ScreenShell
      title="Marketplace de profissionais"
      subtitle="Encontre perfis por serviço, localização e status de verificação."
    >
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Filtros</Text>
        <ServiceTypeFilter value={draftServiceType} onChange={setDraftServiceType} />

        <TextInput
          style={styles.input}
          value={draftState}
          onChangeText={setDraftState}
          placeholder="Estado (ex: RJ)"
          placeholderTextColor={appTheme.colors.textMuted}
          autoCapitalize="characters"
          maxLength={2}
        />

        <TextInput
          style={styles.input}
          value={draftCity}
          onChangeText={setDraftCity}
          placeholder="Cidade (ex: Niterói)"
          placeholderTextColor={appTheme.colors.textMuted}
        />

        <View style={styles.actionRow}>
          <Button label="Aplicar filtros" onPress={onApplyFilters} />
          <Button label="Limpar" variant="secondary" onPress={onResetFilters} />
        </View>
      </View>

      {professionalsQuery.isPending ? (
        <LoadingBlock label="Carregando profissionais..." />
      ) : null}

      {professionalsQuery.isError ? (
        <ErrorState
          title="Falha ao carregar profissionais"
          description="Não conseguimos buscar os perfis agora."
          onRetry={() => professionalsQuery.refetch()}
        />
      ) : null}

      {!professionalsQuery.isPending && !professionalsQuery.isError && items.length === 0 ? (
        <EmptyState
          title="Nenhum profissional encontrado"
          description="Ajuste os filtros para ampliar os resultados."
        />
      ) : null}

      {!professionalsQuery.isPending && !professionalsQuery.isError && items.length > 0 ? (
        <View style={styles.list}>
          {items.map((professional) => (
            <Pressable
              key={professional.id}
              onPress={() =>
                router.push(`/(marketplace)/professionals/${professional.id}`)
              }
              style={styles.card}
            >
              <Text style={styles.cardTitle}>{professional.user.name ?? "Profissional"}</Text>
              <Text style={styles.cardMeta}>
                {(professional.city ?? "-")}/{professional.state ?? "-"} -{" "}
                {verificationLabel(professional.verificationStatus)}
              </Text>
              <Text style={styles.cardBody} numberOfLines={3}>
                {professional.bio ??
                  "Perfil disponível no marketplace para contratação."}
              </Text>
              <Text style={styles.cardFoot}>
                {professional.serviceTypes.map(serviceTypeLabel).join(" | ")}
              </Text>
              <Text style={styles.cardFoot}>
                {moneyRange(professional.hourlyRateMin, professional.hourlyRateMax)}
              </Text>
            </Pressable>
          ))}

          {professionalsQuery.hasNextPage ? (
            <Button
              label="Carregar mais"
              onPress={() => professionalsQuery.fetchNextPage()}
              loading={professionalsQuery.isFetchingNextPage}
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
