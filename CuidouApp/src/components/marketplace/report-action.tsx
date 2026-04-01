import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { useToast } from "@/src/hooks/use-toast";
import { ApiClientError } from "@/src/lib/api/client";
import { marketplaceRepository } from "@/src/lib/api/marketplace-repository";

type ReportTargetType = "USER" | "JOB" | "MESSAGE" | "PROFESSIONAL_PROFILE" | "CONVERSATION";

type ReportActionProps = {
  label?: string;
  targetType: ReportTargetType;
  targetUserId?: string;
  targetJobId?: string;
  targetMessageId?: string;
  targetProfessionalProfileId?: string;
  targetConversationId?: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return "Não foi possível enviar a denúncia.";
}

export function ReportAction({
  label = "Denunciar",
  targetType,
  targetConversationId,
  targetJobId,
  targetMessageId,
  targetProfessionalProfileId,
  targetUserId,
}: ReportActionProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const reportMutation = useMutation({
    mutationFn: () =>
      marketplaceRepository.createReport({
        targetType,
        reason: reason.trim(),
        details: details.trim() || undefined,
        targetConversationId,
        targetJobId,
        targetMessageId,
        targetProfessionalProfileId,
        targetUserId,
      }),
    onSuccess: () => {
      toast.success("Denúncia enviada", "Obrigado. Nossa equipe irá analisar.");
      setReason("");
      setDetails("");
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Falha ao enviar denúncia", getErrorMessage(error));
    },
  });

  const onSubmit = () => {
    if (reason.trim().length < 5) {
      toast.warning("Motivo inválido", "Informe um motivo com pelo menos 5 caracteres.");
      return;
    }

    reportMutation.mutate();
  };

  return (
    <View>
      <Button label={label} variant="ghost" onPress={() => setOpen(true)} />

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Enviar denúncia</Text>
          <Text style={styles.subtitle}>
            Compartilhe o motivo. Isso ajuda a equipe de moderação a agir mais rápido.
          </Text>

          <Text style={styles.label}>Motivo</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            style={styles.input}
            placeholder="Descreva o motivo da denúncia"
            placeholderTextColor={appTheme.colors.textMuted}
            maxLength={240}
          />

          <Text style={styles.label}>Detalhes (opcional)</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            style={[styles.input, styles.textArea]}
            placeholder="Inclua contexto adicional"
            placeholderTextColor={appTheme.colors.textMuted}
            multiline
            numberOfLines={4}
            maxLength={1500}
          />

          <View style={styles.actions}>
            <Button label="Cancelar" variant="secondary" onPress={() => setOpen(false)} />
            <Button
              label="Enviar denúncia"
              onPress={onSubmit}
              loading={reportMutation.isPending}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: appTheme.radius.lg,
    borderTopRightRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
  },
  title: {
    fontSize: appTheme.typography.size.xl,
    color: appTheme.colors.navy,
    fontWeight: appTheme.typography.weight.bold,
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
    lineHeight: 20,
    marginBottom: appTheme.spacing.sm,
  },
  label: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.xs,
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    color: appTheme.colors.textStrong,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    fontSize: appTheme.typography.size.md,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  actions: {
    marginTop: appTheme.spacing.sm,
    flexDirection: "row",
    gap: appTheme.spacing.sm,
    justifyContent: "space-between",
  },
});
