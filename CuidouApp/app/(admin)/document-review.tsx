import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useToast } from "@/src/hooks/use-toast";
import { adminRepository } from "@/src/lib/api/admin-repository";

export default function DocumentReviewScreen() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [reasonById, setReasonById] = useState<Record<string, string>>({});

  const docsQuery = useQuery({
    queryKey: ["admin-pending-documents"],
    queryFn: () => adminRepository.listPendingDocuments(),
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      documentId,
      action,
      reason,
    }: {
      documentId: string;
      action: "APPROVE" | "REJECT";
      reason?: string;
    }) => adminRepository.reviewDocument(documentId, action, reason),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-pending-documents"] });
      toast.success(
        "Sucesso",
        vars.action === "APPROVE" ? "Documento aprovado." : "Documento rejeitado.",
      );
    },
    onError: () => {
      toast.error("Erro", "Não foi possível processar o documento.");
    },
  });

  const docs = docsQuery.data?.items ?? [];

  return (
    <ScreenShell title="Revisão de documentos" subtitle="Aprovação e rejeição de documentos enviados.">
      {docsQuery.isPending ? <LoadingBlock label="Carregando documentos..." /> : null}

      {docsQuery.isError ? (
        <ErrorState
          title="Falha ao carregar"
          description="Não foi possível buscar os documentos pendentes."
          onRetry={() => docsQuery.refetch()}
        />
      ) : null}

      {!docsQuery.isPending && !docsQuery.isError && docs.length === 0 ? (
        <EmptyState
          title="Nenhum documento pendente"
          description="Todos os documentos foram revisados."
        />
      ) : null}

      {docs.map((doc) => (
        <View key={doc.id} style={styles.card}>
          <Text style={styles.docType}>{doc.documentType}</Text>
          <Text style={styles.professional}>
            {doc.professionalProfile.user.name ?? doc.professionalProfile.user.email ?? "-"}
          </Text>
          <Text style={styles.date}>
            Enviado em {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Motivo de rejeição (opcional)"
            placeholderTextColor={appTheme.colors.textMuted}
            value={reasonById[doc.id] ?? ""}
            onChangeText={(text) => setReasonById((prev) => ({ ...prev, [doc.id]: text }))}
            multiline
          />
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, styles.approveBtn]}
              disabled={reviewMutation.isPending}
              onPress={() =>
                reviewMutation.mutate({ documentId: doc.id, action: "APPROVE" })
              }
            >
              <Text style={styles.actionBtnText}>Aprovar</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.rejectBtn]}
              disabled={reviewMutation.isPending}
              onPress={() =>
                reviewMutation.mutate({
                  documentId: doc.id,
                  action: "REJECT",
                  reason: reasonById[doc.id]?.trim() || undefined,
                })
              }
            >
              <Text style={styles.actionBtnText}>Rejeitar</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.md,
    gap: 6,
  },
  docType: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.md,
    fontWeight: appTheme.typography.weight.semibold,
  },
  professional: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.sm,
  },
  date: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.sm,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 8,
    fontSize: appTheme.typography.size.sm,
    color: appTheme.colors.navy,
    minHeight: 60,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: appTheme.radius.full,
    alignItems: "center",
  },
  approveBtn: { backgroundColor: appTheme.colors.indigo },
  rejectBtn: { backgroundColor: "#dc2626" },
  actionBtnText: {
    color: "#fff",
    fontSize: appTheme.typography.size.sm,
    fontWeight: "600",
  },
});
