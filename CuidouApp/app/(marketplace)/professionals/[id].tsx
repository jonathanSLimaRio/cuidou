import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
  shiftLabel,
  verificationLabel,
  weekdayLabel,
} from "@/src/lib/marketplace-formatters";

function getActionError(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return "Não foi possível concluir esta ação.";
}

export default function ProfessionalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { user } = useAuth();
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [inviteMessage, setInviteMessage] = useState(
    "Gostaria de convidar você para se candidatar à vaga da minha família.",
  );

  const professionalQuery = useQuery({
    queryKey: ["marketplace-professional-detail", id],
    queryFn: () => marketplaceRepository.getProfessional(id),
    enabled: Boolean(id),
  });

  const familyJobsQuery = useQuery({
    queryKey: ["family-open-jobs", user?.id],
    queryFn: () => marketplaceRepository.listMyOpenJobs(1, 50),
    enabled: user?.role === "FAMILY",
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      marketplaceRepository.inviteProfessional({
        jobId: selectedJobId,
        professionalId: professionalQuery.data!.userId,
        message: inviteMessage,
      }),
    onSuccess: () => {
      toast.success("Convite enviado", "A profissional receberá o convite no painel dela.");
    },
    onError: (error) => {
      toast.error("Falha ao enviar convite", getActionError(error));
    },
  });

  const availabilitySlots = professionalQuery.data?.availabilitySlots;

  const availabilityByDay = useMemo(() => {
    if (!availabilitySlots) {
      return [] as { day: string; shifts: string[] }[];
    }

    const map = new Map<string, string[]>();
    availabilitySlots.forEach((slot) => {
      const key = weekdayLabel(slot.weekday);
      const current = map.get(key) ?? [];
      current.push(shiftLabel(slot.shift));
      map.set(key, current);
    });

    return Array.from(map.entries()).map(([day, shifts]) => ({ day, shifts }));
  }, [availabilitySlots]);

  const onInvite = () => {
    if (!selectedJobId) {
      toast.warning("Selecione uma vaga", "Escolha uma vaga aberta antes de enviar convite.");
      return;
    }

    inviteMutation.mutate();
  };

  const openJobs = useMemo(
    () => familyJobsQuery.data?.items ?? [],
    [familyJobsQuery.data?.items],
  );

  useEffect(() => {
    if (selectedJobId || openJobs.length === 0) {
      return;
    }

    setSelectedJobId(openJobs[0].id);
  }, [openJobs, selectedJobId]);

  return (
    <ScreenShell
      title="Detalhe do profissional"
      subtitle="Avalie perfil, disponibilidade e convide para vagas abertas."
    >
      {professionalQuery.isPending ? <LoadingBlock label="Carregando perfil..." /> : null}

      {professionalQuery.isError ? (
        <ErrorState
          title="Falha ao carregar profissional"
          description="Não foi possível abrir os detalhes deste perfil."
          onRetry={() => professionalQuery.refetch()}
        />
      ) : null}

      {!professionalQuery.isPending && !professionalQuery.isError && !professionalQuery.data ? (
        <EmptyState
          title="Perfil não encontrado"
          description="Este profissional não está disponível no momento."
        />
      ) : null}

      {!professionalQuery.isPending && !professionalQuery.isError && professionalQuery.data ? (
        <View style={styles.stack}>
          <View style={styles.card}>
            <Text style={styles.title}>
              {professionalQuery.data.user.name ?? "Profissional"}
            </Text>
            <Text style={styles.meta}>
              {(professionalQuery.data.city ?? "-")}/{professionalQuery.data.state ?? "-"} -{" "}
              {verificationLabel(professionalQuery.data.verificationStatus)}
            </Text>
            <Text style={styles.meta}>
              {professionalQuery.data.serviceTypes.map(serviceTypeLabel).join(" | ")}
            </Text>
            <Text style={styles.meta}>
              {moneyRange(
                professionalQuery.data.hourlyRateMin,
                professionalQuery.data.hourlyRateMax,
              )}
            </Text>
            <Text style={styles.body}>
              {professionalQuery.data.bio ??
                "Profissional com perfil ativo no marketplace da Cuidou."}
            </Text>
            <Text style={styles.meta}>
              Avaliação:{" "}
              {professionalQuery.data.reputation.averageRating
                ? professionalQuery.data.reputation.averageRating.toFixed(1)
                : "-"}{" "}
              ({professionalQuery.data.reputation.totalReviews} avaliações)
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Disponibilidade semanal</Text>
            {availabilityByDay.length === 0 ? (
              <Text style={styles.meta}>Sem turnos cadastrados.</Text>
            ) : (
              availabilityByDay.map((item) => (
                <Text key={item.day} style={styles.body}>
                  {item.day}: {item.shifts.join(", ")}
                </Text>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ações</Text>

            {!user ? (
              <Link href="/(public)/login" asChild>
                <Button label="Entrar para contratar" />
              </Link>
            ) : null}

            {user?.role === "FAMILY" ? (
              <View style={styles.form}>
                {familyJobsQuery.isPending ? (
                  <LoadingBlock label="Carregando suas vagas..." />
                ) : null}

                {familyJobsQuery.isError ? (
                  <ErrorState
                    title="Falha ao carregar vagas"
                    description="Não foi possível listar suas vagas abertas."
                    onRetry={() => familyJobsQuery.refetch()}
                  />
                ) : null}

                {!familyJobsQuery.isPending &&
                !familyJobsQuery.isError &&
                openJobs.length === 0 ? (
                  <EmptyState
                    title="Sem vagas abertas"
                    description="Abra uma vaga na área da família para poder convidar profissionais."
                  />
                ) : null}

                {!familyJobsQuery.isPending &&
                !familyJobsQuery.isError &&
                openJobs.length > 0 ? (
                  <>
                    <Text style={styles.meta}>Selecione a vaga para convite:</Text>
                    {openJobs.map((job) => (
                      <View key={job.id} style={styles.jobOptionRow}>
                        <View style={styles.jobOptionText}>
                          <Text style={styles.body}>
                            {job.title} ({job.city}/{job.state})
                          </Text>
                          <Text style={styles.meta}>ID: {job.id}</Text>
                        </View>
                        <Button
                          label={selectedJobId === job.id ? "Selecionada" : "Selecionar"}
                          variant={selectedJobId === job.id ? "primary" : "secondary"}
                          onPress={() => setSelectedJobId(job.id)}
                        />
                      </View>
                    ))}
                    <TextInput
                      style={styles.textArea}
                      value={inviteMessage}
                      onChangeText={setInviteMessage}
                      multiline
                      numberOfLines={4}
                      maxLength={1200}
                    />
                    <Button
                      label="Enviar convite"
                      onPress={onInvite}
                      loading={inviteMutation.isPending}
                    />
                  </>
                ) : null}

                <Link href="/(family)" asChild>
                  <Button label="Ir para área da família" variant="secondary" />
                </Link>
              </View>
            ) : null}

            {user?.role === "PROFESSIONAL" &&
            user.id === professionalQuery.data.userId ? (
              <Link href="/(professional)" asChild>
                <Button label="Ir para área profissional" variant="secondary" />
              </Link>
            ) : null}

            {user && user.id !== professionalQuery.data.userId ? (
              <ReportAction
                label="Denunciar perfil"
                targetType="PROFESSIONAL_PROFILE"
                targetProfessionalProfileId={professionalQuery.data.id}
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
  jobOptionRow: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.sm,
    gap: appTheme.spacing.sm,
  },
  jobOptionText: {
    gap: 4,
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
