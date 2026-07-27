import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useToast } from "@/src/hooks/use-toast";
import { ApiClientError } from "@/src/lib/api/client";
import { familyRepository } from "@/src/lib/api/family-repository";
import { contractStatusLabel } from "@/src/lib/family-formatters";
import type { ContractStatus } from "@/src/lib/types/family";

const statusFilters: { label: string; value?: ContractStatus }[] = [
  { label: "Todos" },
  { label: "Em andamento", value: "IN_PROGRESS" },
  { label: "Concluidos", value: "COMPLETED" },
  { label: "Cancelados", value: "CANCELED" },
];

type ActionModal =
  | { type: "complete"; contractId: string }
  | { type: "cancel"; contractId: string }
  | { type: "review"; contractId: string; applicationId: string }
  | null;

function getErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) return error.message;
  return "Nao foi possivel concluir esta acao.";
}

export default function FamilyContractsScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ContractStatus | undefined>(undefined);
  const [actionModal, setActionModal] = useState<ActionModal>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewedApplicationIds, setReviewedApplicationIds] = useState<Set<string>>(new Set());

  const contractsQuery = useQuery({
    queryKey: ["family-contracts"],
    queryFn: () => familyRepository.listFamilyContracts(),
  });

  const completeMutation = useMutation({
    mutationFn: (contractId: string) => familyRepository.completeContract(contractId),
    onSuccess: () => {
      toast.success("Contrato concluido", "Status atualizado com sucesso.");
      void contractsQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ["family-jobs"] });
      setActionModal(null);
    },
    onError: (error) => {
      toast.error("Falha ao concluir contrato", getErrorMessage(error));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (input: { contractId: string; reason: string }) =>
      familyRepository.cancelContract(input.contractId, input.reason),
    onSuccess: () => {
      toast.success("Contrato cancelado", "Status atualizado com sucesso.");
      void contractsQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ["family-jobs"] });
      setCancelReason("");
      setActionModal(null);
    },
    onError: (error) => {
      toast.error("Falha ao cancelar contrato", getErrorMessage(error));
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (input: { applicationId: string; rating: number; comment?: string }) =>
      familyRepository.submitReview(input.applicationId, input.rating, input.comment),
    onSuccess: (_, variables) => {
      toast.success("Avaliacao enviada", "Obrigado pelo feedback!");
      setReviewedApplicationIds((prev) => new Set([...prev, variables.applicationId]));
      setReviewRating(5);
      setReviewComment("");
      setActionModal(null);
    },
    onError: (error) => {
      toast.error("Falha ao enviar avaliacao", getErrorMessage(error));
    },
  });

  const items = useMemo(() => {
    const all = contractsQuery.data?.items ?? [];
    if (!statusFilter) return all;
    return all.filter((contract) => contract.status === statusFilter);
  }, [contractsQuery.data?.items, statusFilter]);

  const isModalBusy =
    completeMutation.isPending || cancelMutation.isPending || reviewMutation.isPending;

  function handleModalConfirm() {
    if (!actionModal) return;
    if (actionModal.type === "complete") {
      completeMutation.mutate(actionModal.contractId);
    } else if (actionModal.type === "cancel") {
      if (cancelReason.trim().length < 5) {
        toast.warning("Motivo invalido", "Informe um motivo com pelo menos 5 caracteres.");
        return;
      }
      cancelMutation.mutate({ contractId: actionModal.contractId, reason: cancelReason.trim() });
    } else if (actionModal.type === "review") {
      reviewMutation.mutate({
        applicationId: actionModal.applicationId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
    }
  }

  return (
    <ScreenShell title="Contratos da familia" subtitle="Conclua ou cancele contratos em andamento.">
      <Link href="/(family)" asChild>
        <Button label="Voltar ao hub" variant="secondary" />
      </Link>

      {/* Action Modal */}
      <Modal visible={actionModal !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {actionModal?.type === "complete"
                ? "Concluir contrato"
                : actionModal?.type === "cancel"
                  ? "Cancelar contrato"
                  : "Avaliar profissional"}
            </Text>

            {actionModal?.type === "complete" ? (
              <Text style={styles.modalDesc}>
                Confirme a conclusao do contrato. Esta acao nao pode ser desfeita.
              </Text>
            ) : null}

            {actionModal?.type === "cancel" ? (
              <>
                <Text style={styles.modalDesc}>
                  Informe o motivo do cancelamento (minimo 5 caracteres).
                </Text>
                <TextInput
                  value={cancelReason}
                  onChangeText={setCancelReason}
                  placeholder="Ex: Trabalho encerrado por acordo..."
                  placeholderTextColor={appTheme.colors.textMuted}
                  multiline
                  numberOfLines={3}
                  style={[styles.input, styles.inputMultiline]}
                />
              </>
            ) : null}

            {actionModal?.type === "review" ? (
              <>
                <Text style={styles.modalDesc}>Selecione uma nota de 1 a 5 estrelas.</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable key={star} onPress={() => setReviewRating(star)}>
                      <Text style={[styles.star, reviewRating >= star && styles.starActive]}>
                        ★
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  placeholder="Comentario opcional..."
                  placeholderTextColor={appTheme.colors.textMuted}
                  multiline
                  numberOfLines={3}
                  style={[styles.input, styles.inputMultiline]}
                />
              </>
            ) : null}

            <View style={styles.modalActions}>
              <Button
                label="Voltar"
                variant="secondary"
                disabled={isModalBusy}
                onPress={() => {
                  setActionModal(null);
                  setCancelReason("");
                }}
              />
              <Button
                label={
                  actionModal?.type === "complete"
                    ? "Confirmar conclusao"
                    : actionModal?.type === "cancel"
                      ? "Confirmar cancelamento"
                      : "Enviar avaliacao"
                }
                loading={isModalBusy}
                disabled={isModalBusy}
                onPress={handleModalConfirm}
              />
            </View>
          </View>
        </View>
      </Modal>

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

      {contractsQuery.isPending ? <LoadingBlock label="Carregando contratos..." /> : null}
      {contractsQuery.isError ? (
        <ErrorState
          title="Falha ao carregar contratos"
          description="Nao foi possivel listar contratos da familia."
          onRetry={() => contractsQuery.refetch()}
        />
      ) : null}
      {!contractsQuery.isPending && !contractsQuery.isError && items.length === 0 ? (
        <EmptyState
          title="Sem contratos neste filtro"
          description="Aceite candidaturas no pipeline para iniciar novos contratos."
        />
      ) : null}

      {!contractsQuery.isPending && !contractsQuery.isError && items.length > 0 ? (
        <View style={styles.list}>
          {items.map((contract) => {
            const alreadyReviewed = reviewedApplicationIds.has(contract.applicationId);

            return (
              <View key={contract.id} style={styles.card}>
                <Text style={styles.cardTitle}>{contract.job.title}</Text>
                <Text style={styles.meta}>
                  Profissional: {contract.professional.name ?? contract.professional.email ?? "-"}
                </Text>
                <Text style={styles.meta}>Status: {contractStatusLabel(contract.status)}</Text>
                <Text style={styles.meta}>
                  Iniciado em {new Date(contract.startedAt).toLocaleDateString("pt-BR")}
                </Text>
                {contract.completedAt ? (
                  <Text style={styles.meta}>
                    Concluido em {new Date(contract.completedAt).toLocaleDateString("pt-BR")}
                  </Text>
                ) : null}
                {contract.canceledAt ? (
                  <Text style={styles.meta}>
                    Cancelado em {new Date(contract.canceledAt).toLocaleDateString("pt-BR")}
                  </Text>
                ) : null}
                {contract.cancelReason ? (
                  <Text style={styles.warning}>Motivo: {contract.cancelReason}</Text>
                ) : null}

                {contract.status === "IN_PROGRESS" ? (
                  <View style={styles.actions}>
                    <Button
                      label="Concluir contrato"
                      onPress={() =>
                        setActionModal({ type: "complete", contractId: contract.id })
                      }
                    />
                    <Button
                      label="Cancelar contrato"
                      variant="secondary"
                      onPress={() => {
                        setCancelReason("");
                        setActionModal({ type: "cancel", contractId: contract.id });
                      }}
                    />
                  </View>
                ) : null}

                {contract.status === "COMPLETED" && !alreadyReviewed ? (
                  <View style={[styles.actions, styles.reviewBanner]}>
                    <Text style={styles.reviewBannerText}>Avalie o profissional</Text>
                    <Button
                      label="Deixar avaliacao"
                      onPress={() => {
                        setReviewRating(5);
                        setReviewComment("");
                        setActionModal({
                          type: "review",
                          contractId: contract.id,
                          applicationId: contract.applicationId,
                        });
                      }}
                    />
                  </View>
                ) : null}

                {contract.status === "COMPLETED" && alreadyReviewed ? (
                  <Text style={styles.reviewedLabel}>Avaliacao enviada ✓</Text>
                ) : null}
              </View>
            );
          })}
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
  row: { flexDirection: "row", flexWrap: "wrap", gap: appTheme.spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.full,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 8,
    backgroundColor: appTheme.colors.white,
  },
  chipActive: { borderColor: appTheme.colors.indigo, backgroundColor: "rgba(73,98,199,0.1)" },
  chipText: { color: appTheme.colors.text, fontSize: appTheme.typography.size.sm },
  chipTextActive: { color: appTheme.colors.indigo, fontWeight: appTheme.typography.weight.semibold },
  list: { gap: appTheme.spacing.sm },
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
  meta: { color: appTheme.colors.textMuted, fontSize: appTheme.typography.size.sm },
  warning: { color: appTheme.colors.warning, fontSize: appTheme.typography.size.sm },
  actions: { gap: appTheme.spacing.sm, marginTop: appTheme.spacing.xs },
  reviewBanner: {
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
    paddingTop: appTheme.spacing.sm,
    marginTop: appTheme.spacing.sm,
  },
  reviewBannerText: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.sm,
    fontWeight: appTheme.typography.weight.semibold,
  },
  reviewedLabel: {
    color: appTheme.colors.success ?? appTheme.colors.indigo,
    fontSize: appTheme.typography.size.sm,
    marginTop: appTheme.spacing.xs,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: appTheme.spacing.lg,
  },
  modalBox: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: appTheme.colors.white,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
  },
  modalTitle: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.xl,
    fontWeight: appTheme.typography.weight.semibold,
  },
  modalDesc: { color: appTheme.colors.textMuted, fontSize: appTheme.typography.size.sm },
  modalActions: { flexDirection: "row", gap: appTheme.spacing.sm, marginTop: appTheme.spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    color: appTheme.colors.textStrong,
    paddingHorizontal: appTheme.spacing.md,
    fontSize: appTheme.typography.size.md,
    minHeight: 44,
  },
  inputMultiline: { paddingVertical: appTheme.spacing.sm, textAlignVertical: "top" },
  starsRow: { flexDirection: "row", gap: 4 },
  star: { fontSize: 28, color: appTheme.colors.border },
  starActive: { color: "#f59e0b" },
});
