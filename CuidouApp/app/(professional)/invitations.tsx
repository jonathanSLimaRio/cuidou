import { useMutation, useQuery } from "@tanstack/react-query";
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
import { serviceTypeLabel } from "@/src/lib/marketplace-formatters";
import { professionalRepository } from "@/src/lib/api/professional-repository";
import { invitationStatusLabel } from "@/src/lib/professional-formatters";
import type { JobInvitationStatus } from "@/src/lib/types/professional";

const statusFilters: { label: string; value?: JobInvitationStatus }[] = [
  { label: "Pendentes", value: "PENDING" },
  { label: "Todos" },
  { label: "Aceitos", value: "ACCEPTED" },
  { label: "Recusados", value: "DECLINED" },
  { label: "Expirados", value: "EXPIRED" },
];

function mapError(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return "Não foi possível concluir a ação no convite.";
}

export default function ProfessionalInvitationsScreen() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<JobInvitationStatus | undefined>("PENDING");
  const [coverMessages, setCoverMessages] = useState<Record<string, string>>({});
  const [declineReasons, setDeclineReasons] = useState<Record<string, string>>({});

  const invitationsQuery = useQuery({
    queryKey: ["professional-invitations", statusFilter],
    queryFn: () => professionalRepository.listInvitations(statusFilter),
  });

  const acceptMutation = useMutation({
    mutationFn: (input: { invitationId: string; coverMessage: string }) =>
      professionalRepository.acceptInvitation(input.invitationId, input.coverMessage),
    onSuccess: () => {
      toast.success("Convite aceito", "Sua candidatura foi criada.");
      void invitationsQuery.refetch();
    },
    onError: (error) => {
      toast.error("Falha ao aceitar convite", mapError(error));
    },
  });

  const declineMutation = useMutation({
    mutationFn: (input: { invitationId: string; reason?: string }) =>
      professionalRepository.declineInvitation(input.invitationId, input.reason),
    onSuccess: () => {
      toast.success("Convite recusado", "A família foi notificada.");
      void invitationsQuery.refetch();
    },
    onError: (error) => {
      toast.error("Falha ao recusar convite", mapError(error));
    },
  });

  const items = useMemo(() => invitationsQuery.data?.items ?? [], [invitationsQuery.data?.items]);

  const onAccept = (invitationId: string) => {
    const coverMessage =
      coverMessages[invitationId]?.trim() ||
      "Tenho interesse na vaga e confirmo disponibilidade para seguir no processo.";
    if (coverMessage.length < 10) {
      toast.warning("Mensagem curta", "A mensagem deve ter pelo menos 10 caracteres.");
      return;
    }

    acceptMutation.mutate({
      invitationId,
      coverMessage,
    });
  };

  const onDecline = (invitationId: string) => {
    declineMutation.mutate({
      invitationId,
      reason: declineReasons[invitationId]?.trim() || undefined,
    });
  };

  return (
    <ScreenShell
      title="Convites recebidos"
      subtitle="Responda convites para converter em candidatura com um clique."
    >
      <Link href="/(professional)" asChild>
        <Button label="Voltar ao hub" variant="secondary" />
      </Link>

      <View style={styles.panel}>
        <Text style={styles.heading}>Filtro</Text>
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

      {invitationsQuery.isPending ? <LoadingBlock label="Carregando convites..." /> : null}
      {invitationsQuery.isError ? (
        <ErrorState
          title="Falha ao carregar convites"
          description="Não foi possível buscar seus convites."
          onRetry={() => invitationsQuery.refetch()}
        />
      ) : null}
      {!invitationsQuery.isPending && !invitationsQuery.isError && items.length === 0 ? (
        <EmptyState
          title="Sem convites"
          description="Você não possui convites neste filtro."
        />
      ) : null}

      {!invitationsQuery.isPending && !invitationsQuery.isError && items.length > 0 ? (
        <View style={styles.list}>
          {items.map((invitation) => (
            <View key={invitation.id} style={styles.card}>
              <Text style={styles.cardTitle}>{invitation.job.title}</Text>
              <Text style={styles.meta}>
                {invitation.family.name ?? "Família"} - {invitation.job.city}/{invitation.job.state}
              </Text>
              <Text style={styles.meta}>
                {serviceTypeLabel(invitation.job.serviceType)} -{" "}
                {invitationStatusLabel(invitation.status)}
              </Text>
              <Text style={styles.meta}>
                Expira em {new Date(invitation.expiresAt).toLocaleDateString("pt-BR")}
              </Text>
              {invitation.message ? (
                <Text style={styles.body}>Mensagem da família: {invitation.message}</Text>
              ) : null}
              {invitation.status === "PENDING" ? (
                <View style={styles.form}>
                  <TextInput
                    style={styles.textArea}
                    value={coverMessages[invitation.id] ?? ""}
                    placeholder="Mensagem para aceitar convite"
                    placeholderTextColor={appTheme.colors.textMuted}
                    onChangeText={(value) =>
                      setCoverMessages((current) => ({
                        ...current,
                        [invitation.id]: value,
                      }))
                    }
                    multiline
                  />
                  <TextInput
                    style={styles.input}
                    value={declineReasons[invitation.id] ?? ""}
                    placeholder="Motivo da recusa (opcional)"
                    placeholderTextColor={appTheme.colors.textMuted}
                    onChangeText={(value) =>
                      setDeclineReasons((current) => ({
                        ...current,
                        [invitation.id]: value,
                      }))
                    }
                  />
                  <View style={styles.actionRow}>
                    <Button
                      label="Aceitar"
                      onPress={() => onAccept(invitation.id)}
                      loading={acceptMutation.isPending}
                    />
                    <Button
                      label="Recusar"
                      variant="secondary"
                      onPress={() => onDecline(invitation.id)}
                      loading={declineMutation.isPending}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          ))}
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
  meta: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
  },
  body: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.sm,
    lineHeight: 20,
  },
  form: {
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.sm,
  },
  textArea: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    color: appTheme.colors.textStrong,
    padding: appTheme.spacing.md,
    textAlignVertical: "top",
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    color: appTheme.colors.textStrong,
    paddingHorizontal: appTheme.spacing.md,
  },
  actionRow: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
  },
});
