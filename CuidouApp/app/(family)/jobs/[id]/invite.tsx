import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useToast } from "@/src/hooks/use-toast";
import { ApiClientError } from "@/src/lib/api/client";
import { marketplaceRepository } from "@/src/lib/api/marketplace-repository";
import {
  moneyRange,
  serviceTypeLabel,
  verificationLabel,
} from "@/src/lib/marketplace-formatters";
import type {
  ProfessionalListItem,
  ProfessionalsFilter,
  ServiceType,
} from "@/src/lib/types/marketplace";

const PAGE_SIZE = 20;
const DEFAULT_MESSAGE =
  "Gostaria de convidar você para se candidatar à vaga da minha família.";

type ServiceTypeOption = { label: string; value: ServiceType | "" };

const SERVICE_TYPE_OPTIONS: ServiceTypeOption[] = [
  { label: "Todas", value: "" },
  { label: "Babá", value: "BABYSITTER" },
  { label: "Cuidados idosos", value: "ELDER_CAREGIVER" },
];

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  return "Não foi possível enviar o convite.";
}

export default function InviteProfessionalsScreen() {
  const { id: jobId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  // Filter draft state (not yet applied)
  const [draftServiceType, setDraftServiceType] = useState<ServiceType | "">("");
  const [draftState, setDraftState] = useState("");
  const [draftCity, setDraftCity] = useState("");

  // Applied filters that actually drive the query
  const [filters, setFilters] = useState<ProfessionalsFilter>({ verifiedOnly: true });

  // Invite modal
  const [inviteTarget, setInviteTarget] = useState<ProfessionalListItem | null>(null);
  const [inviteMessage, setInviteMessage] = useState(DEFAULT_MESSAGE);

  // Session-scoped set of user IDs that were successfully invited
  const [sentUserIds, setSentUserIds] = useState<Set<string>>(new Set());

  // Job header info
  const jobQuery = useQuery({
    queryKey: ["job-for-invite", jobId],
    queryFn: () => marketplaceRepository.getJob(jobId),
    enabled: Boolean(jobId),
  });

  // Paginated professionals list
  const professionalsQuery = useInfiniteQuery({
    queryKey: ["professionals-for-invite", jobId, filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      marketplaceRepository.listProfessionals(filters, pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: Boolean(jobId),
  });

  const professionals = useMemo(
    () => professionalsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [professionalsQuery.data?.pages],
  );

  const inviteMutation = useMutation({
    mutationFn: () => {
      if (!inviteTarget) throw new Error("no_target");
      return marketplaceRepository.inviteProfessional({
        jobId,
        professionalId: inviteTarget.userId,
        message: inviteMessage.trim() || DEFAULT_MESSAGE,
      });
    },
    onSuccess: () => {
      if (inviteTarget) {
        setSentUserIds((prev) => new Set([...prev, inviteTarget.userId]));
      }
      toast.success(
        "Convite enviado",
        "O profissional receberá uma notificação em breve.",
      );
      setInviteTarget(null);
      setInviteMessage(DEFAULT_MESSAGE);
    },
    onError: (error) => {
      toast.error("Falha ao enviar convite", getErrorMessage(error));
    },
  });

  function applyFilters() {
    setFilters({
      serviceType: draftServiceType,
      state: draftState.trim(),
      city: draftCity.trim(),
      verifiedOnly: true,
    });
  }

  function resetFilters() {
    setDraftServiceType("");
    setDraftState("");
    setDraftCity("");
    setFilters({ verifiedOnly: true });
  }

  const jobTitle = jobQuery.data?.title ?? "Vaga";

  return (
    <ScreenShell
      title="Convidar profissionais"
      subtitle={`Vaga: ${jobTitle}`}
    >
      <Button label="← Voltar" variant="secondary" onPress={() => router.back()} />

      {/* Search filters */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Filtros de busca</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {SERVICE_TYPE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.label}
              onPress={() => setDraftServiceType(opt.value)}
              style={[
                styles.chip,
                draftServiceType === opt.value && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  draftServiceType === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

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
          <Button label="Aplicar" onPress={applyFilters} />
          <Button label="Limpar" variant="secondary" onPress={resetFilters} />
        </View>
      </View>

      {/* Results */}
      {professionalsQuery.isPending ? (
        <LoadingBlock label="Buscando profissionais..." />
      ) : null}

      {professionalsQuery.isError ? (
        <ErrorState
          title="Falha ao buscar profissionais"
          description="Não foi possível carregar a lista. Tente novamente."
          onRetry={() => professionalsQuery.refetch()}
        />
      ) : null}

      {!professionalsQuery.isPending &&
      !professionalsQuery.isError &&
      professionals.length === 0 ? (
        <EmptyState
          title="Nenhum profissional encontrado"
          description="Ajuste os filtros para ampliar a busca."
        />
      ) : null}

      {professionals.map((pro) => {
        const alreadySent = sentUserIds.has(pro.userId);
        return (
          <View key={pro.id} style={styles.card}>
            <Text style={styles.cardName}>{pro.user.name ?? "Profissional"}</Text>
            <Text style={styles.cardMeta}>
              {pro.city ?? "-"}/{pro.state ?? "-"} ·{" "}
              {verificationLabel(pro.verificationStatus)}
            </Text>
            {pro.bio ? (
              <Text style={styles.cardBio} numberOfLines={2}>
                {pro.bio}
              </Text>
            ) : null}
            <Text style={styles.cardFoot}>
              {pro.serviceTypes.map(serviceTypeLabel).join(" | ")}
              {pro.hourlyRateMin || pro.hourlyRateMax
                ? `  ·  ${moneyRange(pro.hourlyRateMin, pro.hourlyRateMax)}`
                : ""}
            </Text>
            {pro.reputation?.averageRating ? (
              <Text style={styles.cardFoot}>
                ★ {pro.reputation.averageRating.toFixed(1)}{" "}
                ({pro.reputation.totalReviews} avaliações)
              </Text>
            ) : null}

            {alreadySent ? (
              <View style={styles.sentBadge}>
                <Text style={styles.sentBadgeText}>✓ Convite enviado</Text>
              </View>
            ) : (
              <Button
                label="Convidar para esta vaga"
                onPress={() => {
                  setInviteTarget(pro);
                  setInviteMessage(DEFAULT_MESSAGE);
                }}
              />
            )}
          </View>
        );
      })}

      {professionalsQuery.hasNextPage ? (
        <Button
          label="Carregar mais"
          onPress={() => professionalsQuery.fetchNextPage()}
          loading={professionalsQuery.isFetchingNextPage}
        />
      ) : professionals.length > 0 ? (
        <Text style={styles.endLabel}>Fim da lista.</Text>
      ) : null}

      {/* Invite bottom-sheet modal */}
      <Modal
        visible={inviteTarget !== null}
        animationType="slide"
        transparent
        onRequestClose={() => !inviteMutation.isPending && setInviteTarget(null)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => !inviteMutation.isPending && setInviteTarget(null)}
        />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Enviar convite</Text>
          <Text style={styles.sheetSub}>
            Para: {inviteTarget?.user.name ?? "Profissional"}
          </Text>
          <Text style={styles.sheetSub}>Vaga: {jobTitle}</Text>

          <Text style={styles.fieldLabel}>Mensagem personalizada</Text>
          <TextInput
            value={inviteMessage}
            onChangeText={setInviteMessage}
            style={[styles.input, styles.textArea]}
            placeholder="Escreva uma mensagem para o profissional..."
            placeholderTextColor={appTheme.colors.textMuted}
            multiline
            numberOfLines={4}
            maxLength={1200}
          />

          <View style={styles.actionRow}>
            <Button
              label="Cancelar"
              variant="secondary"
              onPress={() => setInviteTarget(null)}
              disabled={inviteMutation.isPending}
            />
            <Button
              label="Enviar convite"
              onPress={() => inviteMutation.mutate()}
              loading={inviteMutation.isPending}
            />
          </View>
        </View>
      </Modal>
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
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.lg,
    fontWeight: appTheme.typography.weight.semibold,
  },
  chipRow: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
    paddingVertical: 2,
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
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    color: appTheme.colors.textStrong ?? appTheme.colors.navy,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    fontSize: appTheme.typography.size.md,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  actionRow: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
  },
  // Professional cards
  card: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.md,
    gap: 6,
  },
  cardName: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.lg,
    fontWeight: appTheme.typography.weight.semibold,
  },
  cardMeta: {
    color: appTheme.colors.indigo,
    fontSize: appTheme.typography.size.sm,
  },
  cardBio: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.sm,
    lineHeight: 20,
  },
  cardFoot: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
  },
  sentBadge: {
    borderRadius: appTheme.radius.md,
    backgroundColor: "rgba(34,197,94,0.1)",
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  sentBadgeText: {
    color: "#15803d",
    fontSize: appTheme.typography.size.sm,
    fontWeight: appTheme.typography.weight.semibold,
  },
  endLabel: {
    textAlign: "center",
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
    paddingVertical: appTheme.spacing.sm,
  },
  // Invite sheet
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: appTheme.radius.lg,
    borderTopRightRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.surface ?? appTheme.colors.white,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
  },
  sheetTitle: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.xl,
    fontWeight: appTheme.typography.weight.bold,
  },
  sheetSub: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
  },
  fieldLabel: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.xs,
    textTransform: "uppercase",
    letterSpacing: 0.2,
    marginTop: appTheme.spacing.xs ?? 4,
  },
});
