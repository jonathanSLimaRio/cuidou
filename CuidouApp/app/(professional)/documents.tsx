import * as DocumentPicker from "expo-document-picker";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Linking from "expo-linking";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useToast } from "@/src/hooks/use-toast";
import { ApiClientError } from "@/src/lib/api/client";
import { professionalRepository } from "@/src/lib/api/professional-repository";
import {
  documentTypeLabel,
  verificationStatusLabel,
} from "@/src/lib/professional-formatters";
import type { DocumentType, ProfessionalDocument, VerificationStatus } from "@/src/lib/types/professional";

const PAGE_SIZE = 20;

const documentTypes: DocumentType[] = [
  "IDENTITY",
  "BACKGROUND_CHECK",
  "CERTIFICATION",
  "OTHER",
];
const statusFilters: { label: string; value?: VerificationStatus }[] = [
  { label: "Todos" },
  { label: "Em revisão", value: "UNDER_REVIEW" },
  { label: "Verificados", value: "VERIFIED" },
  { label: "Rejeitados", value: "REJECTED" },
];

function mapError(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return "Não foi possível processar documento.";
}

export default function ProfessionalDocumentsScreen() {
  const toast = useToast();
  const [selectedType, setSelectedType] = useState<DocumentType>("IDENTITY");
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | undefined>(undefined);

  const documentsQuery = useInfiniteQuery({
    queryKey: ["professional-documents", statusFilter],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      professionalRepository.listDocuments({
        page: pageParam,
        pageSize: PAGE_SIZE,
        status: statusFilter,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error("no_file_selected");
      }
      return professionalRepository.uploadDocument({
        documentType: selectedType,
        file: selectedFile,
      });
    },
    onSuccess: () => {
      toast.success("Documento enviado", "Seu arquivo está em revisão.");
      setSelectedFile(null);
      void documentsQuery.refetch();
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "no_file_selected") {
        toast.warning("Arquivo obrigatório", "Selecione um arquivo antes de enviar.");
        return;
      }
      toast.error("Falha no upload", mapError(error));
    },
  });

  const items = useMemo<ProfessionalDocument[]>(
    () => documentsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [documentsQuery.data?.pages],
  );

  const chooseFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      setSelectedFile(result.assets[0]);
    }
  };

  return (
    <ScreenShell
      title="Documentos"
      subtitle="Envie documentos para verificação e acompanhe histórico de análise."
    >
      <Link href="/(professional)" asChild>
        <Button label="Voltar ao hub" variant="secondary" />
      </Link>

      <View style={styles.uploadCard}>
        <Text style={styles.heading}>Novo envio</Text>
        <View style={styles.row}>
          {documentTypes.map((documentType) => (
            <Pressable
              key={documentType}
              onPress={() => setSelectedType(documentType)}
              style={[
                styles.chip,
                selectedType === documentType && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedType === documentType && styles.chipTextActive,
                ]}
              >
                {documentTypeLabel(documentType)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Button label="Selecionar arquivo" variant="secondary" onPress={() => void chooseFile()} />
        {selectedFile ? (
          <Text style={styles.meta}>Arquivo: {selectedFile.name ?? "documento"}</Text>
        ) : (
          <Text style={styles.meta}>Nenhum arquivo selecionado.</Text>
        )}
        <Button
          label="Enviar documento"
          onPress={() => uploadMutation.mutate()}
          loading={uploadMutation.isPending}
        />
      </View>

      <View style={styles.uploadCard}>
        <Text style={styles.heading}>Histórico</Text>
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

        {documentsQuery.isPending ? <LoadingBlock label="Carregando documentos..." /> : null}
        {documentsQuery.isError ? (
          <ErrorState
            title="Falha ao carregar documentos"
            description="Não foi possível buscar seu histórico."
            onRetry={() => documentsQuery.refetch()}
          />
        ) : null}
        {!documentsQuery.isPending && !documentsQuery.isError && items.length === 0 ? (
          <EmptyState
            title="Sem documentos"
            description="Envie seu primeiro documento para iniciar a verificação."
          />
        ) : null}
        {!documentsQuery.isPending && !documentsQuery.isError && items.length > 0 ? (
          <View style={styles.list}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{documentTypeLabel(item.documentType)}</Text>
                <Text style={styles.meta}>
                  Status: {verificationStatusLabel(item.status)}
                </Text>
                <Text style={styles.meta}>
                  Enviado em {new Date(item.createdAt).toLocaleString("pt-BR")}
                </Text>
                {item.rejectionReason ? (
                  <Text style={styles.warning}>Motivo: {item.rejectionReason}</Text>
                ) : null}
                <Button
                  label="Abrir arquivo"
                  variant="ghost"
                  onPress={() => {
                    void Linking.openURL(item.fileUrl);
                  }}
                />
              </View>
            ))}
            {documentsQuery.hasNextPage ? (
              <Button
                label="Carregar mais"
                onPress={() => documentsQuery.fetchNextPage()}
                loading={documentsQuery.isFetchingNextPage}
              />
            ) : (
              <Text style={styles.meta}>Fim do histórico.</Text>
            )}
          </View>
        ) : null}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  uploadCard: {
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
  meta: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
  },
  list: {
    gap: appTheme.spacing.sm,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.md,
    gap: 6,
  },
  itemTitle: {
    color: appTheme.colors.navy,
    fontWeight: appTheme.typography.weight.semibold,
    fontSize: appTheme.typography.size.md,
  },
  warning: {
    color: appTheme.colors.warning,
    fontSize: appTheme.typography.size.sm,
  },
});
