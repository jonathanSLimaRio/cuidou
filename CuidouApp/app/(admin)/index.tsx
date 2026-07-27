import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useAuth } from "@/src/hooks/use-auth";
import { adminRepository } from "@/src/lib/api/admin-repository";

const sections = [
  {
    href: "/(admin)/pending-users",
    title: "Usuários pendentes",
    description: "Aprove ou suspenda contas que aguardam ativação.",
  },
  {
    href: "/(admin)/document-review",
    title: "Revisão de documentos",
    description: "Aprove ou rejeite documentos de profissionais.",
  },
  {
    href: "/(admin)/reports",
    title: "Denúncias",
    description: "Resolva ou descarte denúncias abertas.",
  },
  {
    href: "/(admin)/jobs",
    title: "Vagas",
    description: "Modere status e visibilidade das vagas.",
  },
  {
    href: "/(admin)/invites",
    title: "Convites de admin",
    description: "Crie e gerencie convites de acesso administrativo.",
  },
  {
    href: "/(admin)/audit-log",
    title: "Trilha de auditoria",
    description: "Consulte o histórico de todas as ações administrativas.",
  },
] as const;

export default function AdminHomeScreen() {
  const { logout } = useAuth();

  const metricsQuery = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: () => adminRepository.getMetrics(30),
  });

  return (
    <ScreenShell
      title="Painel Admin"
      subtitle="Moderação, operação e métricas da plataforma."
    >
      {metricsQuery.isPending ? <LoadingBlock label="Carregando métricas..." /> : null}
      {metricsQuery.isError ? (
        <ErrorState
          title="Falha ao carregar métricas"
          description="Não foi possível buscar os dados administrativos."
          onRetry={() => metricsQuery.refetch()}
        />
      ) : null}

      {metricsQuery.data ? (
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {metricsQuery.data.contractsByStatus["IN_PROGRESS"] ?? 0}
            </Text>
            <Text style={styles.metricLabel}>Contratos ativos</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{metricsQuery.data.responseRate24h}%</Text>
            <Text style={styles.metricLabel}>Resposta em 24h</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {metricsQuery.data.averageTimeToHireHours !== null
                ? `${metricsQuery.data.averageTimeToHireHours}h`
                : "-"}
            </Text>
            <Text style={styles.metricLabel}>Tempo médio p/ contratar</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {Object.values(metricsQuery.data.reportsByTargetType).reduce(
                (acc, n) => acc + n,
                0,
              )}
            </Text>
            <Text style={styles.metricLabel}>Total de denúncias</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{metricsQuery.data.commercialEvents.lead_captured ?? 0}</Text>
            <Text style={styles.metricLabel}>Leads capturados</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{metricsQuery.data.commercialEvents.signup_completed ?? 0}</Text>
            <Text style={styles.metricLabel}>Cadastros concluídos</Text>
          </View>
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

      <Button label="Sair" onPress={() => void logout()} variant="secondary" />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appTheme.spacing.sm,
  },
  metricCard: {
    flex: 1,
    minWidth: "45%",
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.md,
    alignItems: "center",
  },
  metricValue: {
    color: appTheme.colors.indigo,
    fontSize: appTheme.typography.size.xl,
    fontWeight: appTheme.typography.weight.bold,
  },
  metricLabel: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.xs,
    textAlign: "center",
    marginTop: 4,
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
