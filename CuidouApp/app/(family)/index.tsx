import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useAuth } from "@/src/hooks/use-auth";
import { familyRepository } from "@/src/lib/api/family-repository";

const sections = [
  {
    href: "/(family)/profile",
    title: "Perfil da familia",
    description: "Atualize dados de contato e localizacao para facilitar contratacoes.",
  },
  {
    href: "/(family)/jobs",
    title: "Vagas",
    description: "Crie, edite, pause/reabra e arquive vagas com agenda estruturada.",
  },
  {
    href: "/(family)/pipeline",
    title: "Pipeline",
    description: "Aceite, recuse ou favorite candidaturas por vaga e status.",
  },
  {
    href: "/(family)/invitations",
    title: "Convites enviados",
    description: "Acompanhe respostas e cancele convites pendentes.",
  },
  {
    href: "/(family)/contracts",
    title: "Contratos",
    description: "Conclua ou cancele contratos em andamento.",
  },
  {
    href: "/(protected)/chat",
    title: "Mensagens",
    description: "Converse com profissionais sobre vagas e contratos.",
  },
  {
    href: "/(protected)/notifications",
    title: "Notificacoes",
    description: "Veja alertas e atividades da plataforma.",
  },
] as const;

export default function FamilyHomeScreen() {
  const { user, logout } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["family-profile-summary"],
    queryFn: () => familyRepository.getFamilyProfile(),
  });

  const jobsQuery = useQuery({
    queryKey: ["family-jobs-summary"],
    queryFn: () => familyRepository.listMyJobs({ page: 1, pageSize: 20 }),
  });

  const contractsQuery = useQuery({
    queryKey: ["family-contracts-summary"],
    queryFn: () => familyRepository.listFamilyContracts(),
  });

  return (
    <ScreenShell
      title="Area da familia"
      subtitle="Gerencie perfil, vagas, candidaturas, convites e contratos pelo app."
    >
      {profileQuery.isPending || jobsQuery.isPending || contractsQuery.isPending ? (
        <LoadingBlock label="Carregando resumo..." />
      ) : null}

      {profileQuery.isError || jobsQuery.isError || contractsQuery.isError ? (
        <ErrorState
          title="Falha ao carregar resumo"
          description="Nao foi possivel carregar os dados da area da familia."
          onRetry={() => {
            void profileQuery.refetch();
            void jobsQuery.refetch();
            void contractsQuery.refetch();
          }}
        />
      ) : null}

      {!profileQuery.isPending &&
      !jobsQuery.isPending &&
      !contractsQuery.isPending &&
      !profileQuery.isError &&
      !jobsQuery.isError &&
      !contractsQuery.isError ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumo da conta</Text>
          <Text style={styles.summaryItem}>Nome: {user?.name ?? "Sem nome"}</Text>
          <Text style={styles.summaryItem}>Email: {user?.email ?? "-"}</Text>
          <Text style={styles.summaryItem}>
            Contato: {profileQuery.data.profile?.contactName ?? "Nao preenchido"}
          </Text>
          <Text style={styles.summaryItem}>
            Localizacao: {profileQuery.data.profile?.city ?? "-"} /{" "}
            {profileQuery.data.profile?.state ?? "-"}
          </Text>
          <Text style={styles.summaryItem}>Vagas: {jobsQuery.data.total}</Text>
          <Text style={styles.summaryItem}>Contratos: {contractsQuery.data.items.length}</Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        {sections.map((section) => (
          <View key={section.href} style={styles.card}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardDescription}>{section.description}</Text>
            <Link href={section.href} asChild>
              <Button label="Abrir modulo" />
            </Link>
          </View>
        ))}
      </View>

      <Link href="/(marketplace)/professionals" asChild>
        <Button label="Buscar profissionais" variant="secondary" />
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

