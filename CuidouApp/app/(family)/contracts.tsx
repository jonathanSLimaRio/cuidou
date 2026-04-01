import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

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

function getErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return "Nao foi possivel concluir esta acao.";
}

export default function FamilyContractsScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ContractStatus | undefined>(undefined);
  const [cancelReasons, setCancelReasons] = useState<Record<string, string>>({});
  const [busyById, setBusyById] = useState<Record<string, string>>({});

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
    },
    onError: (error) => {
      toast.error("Falha ao cancelar contrato", getErrorMessage(error));
    },
  });

  const items = useMemo(() => {
    const all = contractsQuery.data?.items ?? [];
    if (!statusFilter) {
      return all;
    }
    return all.filter((contract) => contract.status === statusFilter);
  }, [contractsQuery.data?.items, statusFilter]);

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

  const onCancel = async (contractId: string) => {
    const reason = cancelReasons[contractId]?.trim() ?? "";
    if (reason.length < 5) {
      toast.warning("Motivo invalido", "Informe um motivo com pelo menos 5 caracteres.");
      return;
    }

    await runWithBusy(contractId, "cancel", async () => {
      await cancelMutation.mutateAsync({
        contractId,
        reason,
      });
    });
  };

  return (
    <ScreenShell title="Contratos da familia" subtitle="Conclua ou cancele contratos em andamento.">
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
            const busyAction = busyById[contract.id];
            const isBusy = Boolean(busyAction);

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
                {contract.cancelReason ? <Text style={styles.warning}>Motivo: {contract.cancelReason}</Text> : null}

                {contract.status === "IN_PROGRESS" ? (
                  <View style={styles.actions}>
                    <Button
                      label="Concluir contrato"
                      onPress={() =>
                        void runWithBusy(contract.id, "complete", async () => {
                          await completeMutation.mutateAsync(contract.id);
                        })
                      }
                      loading={busyAction === "complete"}
                      disabled={isBusy && busyAction !== "complete"}
                    />
                    <TextInput
                      value={cancelReasons[contract.id] ?? ""}
                      onChangeText={(value) =>
                        setCancelReasons((current) => ({
                          ...current,
                          [contract.id]: value,
                        }))
                      }
                      placeholder="Motivo do cancelamento"
                      placeholderTextColor={appTheme.colors.textMuted}
                      style={styles.input}
                    />
                    <Button
                      label="Cancelar contrato"
                      variant="secondary"
                      onPress={() => void onCancel(contract.id)}
                      loading={busyAction === "cancel"}
                      disabled={isBusy && busyAction !== "cancel"}
                    />
                  </View>
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
  warning: {
    color: appTheme.colors.warning,
    fontSize: appTheme.typography.size.sm,
  },
  actions: {
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.xs,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    color: appTheme.colors.textStrong,
    paddingHorizontal: appTheme.spacing.md,
    fontSize: appTheme.typography.size.md,
  },
});

