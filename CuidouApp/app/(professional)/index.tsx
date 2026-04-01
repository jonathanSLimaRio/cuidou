import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useAuth } from "@/src/hooks/use-auth";
import { professionalRepository } from "@/src/lib/api/professional-repository";
import { verificationStatusLabel } from "@/src/lib/professional-formatters";

const sections = [
  {
    href: "/(professional)/profile",
    title: "Perfil profissional",
    description: "Atualize especialidades, valores e informações de contato.",
  },
  {
    href: "/(professional)/availability",
    title: "Disponibilidade",
    description: "Defina agenda semanal e exceções por data/turno.",
  },
  {
    href: "/(professional)/documents",
    title: "Documentos",
    description: "Envie documentos e acompanhe histórico de revisão.",
  },
  {
    href: "/(professional)/invitations",
    title: "Convites recebidos",
    description: "Aceite ou recuse convites com resposta personalizada.",
  },
  {
    href: "/(professional)/applications",
    title: "Candidaturas enviadas",
    description: "Acompanhe todas as candidaturas por status.",
  },
] as const;

export default function ProfessionalHomeScreen() {
  const { user, logout } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["professional-profile-summary"],
    queryFn: () => professionalRepository.getProfile(),
  });

  return (
    <ScreenShell
      title="Área profissional"
      subtitle="Gerencie perfil, agenda, documentos, convites e candidaturas sem depender do web."
    >
      {profileQuery.isPending ? <LoadingBlock label="Carregando resumo..." /> : null}
      {profileQuery.isError ? (
        <ErrorState
          title="Falha ao carregar resumo"
          description="Não foi possível buscar seu perfil agora."
          onRetry={() => profileQuery.refetch()}
        />
      ) : null}

      {!profileQuery.isPending && !profileQuery.isError ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumo da conta</Text>
          <Text style={styles.summaryItem}>Nome: {user?.name ?? "Sem nome"}</Text>
          <Text style={styles.summaryItem}>Email: {user?.email ?? "-"}</Text>
          <Text style={styles.summaryItem}>
            Verificação:{" "}
            {verificationStatusLabel(
              profileQuery.data?.profile?.verificationStatus ?? "NOT_SUBMITTED",
            )}
          </Text>
          <Text style={styles.summaryItem}>
            Localização: {profileQuery.data?.profile?.city ?? "-"} /{" "}
            {profileQuery.data?.profile?.state ?? "-"}
          </Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        {sections.map((section) => (
          <View key={section.href} style={styles.card}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardDescription}>{section.description}</Text>
            <Link href={section.href} asChild>
              <Button label="Abrir módulo" />
            </Link>
          </View>
        ))}
      </View>

      <Link href="/(marketplace)/jobs" asChild>
        <Button label="Buscar vagas no marketplace" variant="secondary" />
      </Link>
      <Button label="Sair" onPress={() => void logout()} variant="secondary" />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.md,
    gap: 6,
  },
  summaryTitle: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.lg,
    fontWeight: appTheme.typography.weight.semibold,
  },
  summaryItem: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.sm,
  },
  grid: {
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
  cardTitle: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.lg,
    fontWeight: appTheme.typography.weight.semibold,
  },
  cardDescription: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
    lineHeight: 20,
  },
});
