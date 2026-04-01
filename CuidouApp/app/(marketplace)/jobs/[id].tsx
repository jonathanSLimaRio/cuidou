import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { ReportAction } from "@/src/components/marketplace/report-action";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useAuth } from "@/src/hooks/use-auth";
import { useToast } from "@/src/hooks/use-toast";
import { ApiClientError } from "@/src/lib/api/client";
import { marketplaceRepository } from "@/src/lib/api/marketplace-repository";
import {
  moneyRange,
  serviceTypeLabel,
  weekdayLabel,
} from "@/src/lib/marketplace-formatters";

function getActionError(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return "Não foi possível concluir esta ação.";
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { user } = useAuth();
  const [coverMessage, setCoverMessage] = useState(
    "Tenho interesse na vaga e posso compartilhar minha experiência.",
  );

  const jobQuery = useQuery({
    queryKey: ["marketplace-job-detail", id],
    queryFn: () => marketplaceRepository.getJob(id),
    enabled: Boolean(id),
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      marketplaceRepository.applyToJob(id, coverMessage.trim()),
    onSuccess: (result) => {
      const warning = result.scheduleMatchWarning?.message;
      toast.success(
        "Candidatura enviada",
        warning ?? "Sua candidatura foi enviada com sucesso.",
      );
    },
    onError: (error) => {
      toast.error("Falha ao candidatar", getActionError(error));
    },
  });

  const onApply = () => {
    if (coverMessage.trim().length < 10) {
      toast.warning("Mensagem curta", "A mensagem deve ter pelo menos 10 caracteres.");
      return;
    }

    applyMutation.mutate();
  };

  return (
    <ScreenShell
      title="Detalhe da vaga"
      subtitle="Veja agenda, valores e envie candidatura quando autenticado."
    >
      {jobQuery.isPending ? <LoadingBlock label="Carregando vaga..." /> : null}

      {jobQuery.isError ? (
        <ErrorState
          title="Falha ao carregar vaga"
          description="Não foi possível abrir os detalhes desta vaga."
          onRetry={() => jobQuery.refetch()}
        />
      ) : null}

      {!jobQuery.isPending && !jobQuery.isError && !jobQuery.data ? (
        <EmptyState title="Vaga não encontrada" description="Este anúncio não está disponível." />
      ) : null}

      {!jobQuery.isPending && !jobQuery.isError && jobQuery.data ? (
        <View style={styles.stack}>
          <View style={styles.card}>
            <Text style={styles.title}>{jobQuery.data.title}</Text>
            <Text style={styles.meta}>
              {serviceTypeLabel(jobQuery.data.serviceType)} - {jobQuery.data.city}/
              {jobQuery.data.state}
            </Text>
            <Text style={styles.meta}>
              {moneyRange(jobQuery.data.hourlyRateMin, jobQuery.data.hourlyRateMax)}
            </Text>
            <Text style={styles.body}>{jobQuery.data.description}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Agenda</Text>
            {jobQuery.data.scheduleSlots?.length ? (
              jobQuery.data.scheduleSlots.map((slot) => (
                <Text key={`${slot.weekday}-${slot.startTime}-${slot.endTime}`} style={styles.body}>
                  {weekdayLabel(slot.weekday)} - {slot.startTime} às {slot.endTime}
                </Text>
              ))
            ) : (
              <Text style={styles.meta}>Agenda detalhada não informada.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ações</Text>

            {!user ? (
              <Link href="/(public)/login" asChild>
                <Button label="Entrar para se candidatar" />
              </Link>
            ) : null}

            {user?.role === "PROFESSIONAL" ? (
              <View style={styles.form}>
                <Text style={styles.meta}>Mensagem de candidatura</Text>
                <TextInput
                  style={styles.textArea}
                  value={coverMessage}
                  onChangeText={setCoverMessage}
                  multiline
                  numberOfLines={4}
                  maxLength={1500}
                />
                <Button
                  label="Enviar candidatura"
                  onPress={onApply}
                  loading={applyMutation.isPending}
                />
              </View>
            ) : null}

            {user?.role === "FAMILY" && user.id === jobQuery.data.familyId ? (
              <Link href="/(family)" asChild>
                <Button label="Ir para área da família" variant="secondary" />
              </Link>
            ) : null}

            {user?.role === "FAMILY" && user.id !== jobQuery.data.familyId ? (
              <Link href="/(marketplace)/professionals" asChild>
                <Button label="Buscar profissionais" variant="secondary" />
              </Link>
            ) : null}

            {user && user.id !== jobQuery.data.familyId ? (
              <ReportAction
                label="Denunciar vaga"
                targetType="JOB"
                targetJobId={jobQuery.data.id}
              />
            ) : null}
          </View>
        </View>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: appTheme.spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.sm,
  },
  title: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.xl,
    fontWeight: appTheme.typography.weight.bold,
  },
  sectionTitle: {
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
    fontSize: appTheme.typography.size.md,
    lineHeight: 22,
  },
  form: {
    gap: appTheme.spacing.sm,
  },
  textArea: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    color: appTheme.colors.textStrong,
    padding: appTheme.spacing.md,
    textAlignVertical: "top",
  },
});
