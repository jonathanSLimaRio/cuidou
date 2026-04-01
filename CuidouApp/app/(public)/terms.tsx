import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { ScreenShell } from "@/src/components/ui/screen-shell";

const sections = [
  {
    title: "1. Objeto da plataforma",
    body: "A Cuidou conecta famílias e profissionais de cuidado infantil e de idosos para interações de contratação. Não realizamos intermediação de pagamento e não somos parte do contrato privado firmado entre as partes.",
  },
  {
    title: "2. Cadastro e responsabilidade de conta",
    body: "Cada usuário deve fornecer informações verdadeiras, manter seus dados atualizados e proteger as credenciais de acesso. O compartilhamento de conta com terceiros é proibido.",
  },
  {
    title: "3. Regras de uso e conduta",
    body: "É vedado publicar conteúdo ilícito, discriminatório, ofensivo ou fraudulento. Perfis, vagas, mensagens e documentos podem ser moderados e auditados para garantir segurança e integridade do marketplace.",
  },
  {
    title: "4. Contratação e relacionamento entre as partes",
    body: "A decisão de contratar, os termos de trabalho e eventuais obrigações legais são de responsabilidade exclusiva da família e da profissional envolvidas no acordo.",
  },
  {
    title: "5. Suspensão e encerramento",
    body: "Contas podem ser suspensas ou banidas em casos de violação destes termos, fraude, abuso da plataforma ou descumprimento de obrigações legais.",
  },
  {
    title: "6. Atualizações destes termos",
    body: "Podemos atualizar estes Termos de Uso para refletir mudanças de produto, operação ou legislação aplicável. A versão vigente será publicada nesta tela.",
  },
];

export default function TermsScreen() {
  return (
    <ScreenShell
      title="Termos de Uso"
      subtitle="Regras gerais para uso da plataforma Cuidou. Última atualização: 29/03/2026."
    >
      <View style={styles.stack}>
        {sections.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardBody}>{section.body}</Text>
          </View>
        ))}
        <Text style={styles.footer}>
          Em caso de dúvidas, entre em contato:{" "}
          <Link href="mailto:suporte@cuidou.app" style={styles.link}>
            suporte@cuidou.app
          </Link>
          .
        </Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: appTheme.spacing.md,
  },
  card: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.md,
    gap: 8,
  },
  cardTitle: {
    color: appTheme.colors.navy,
    fontWeight: appTheme.typography.weight.semibold,
    fontSize: appTheme.typography.size.lg,
  },
  cardBody: {
    color: appTheme.colors.text,
    lineHeight: 22,
    fontSize: appTheme.typography.size.md,
  },
  footer: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.sm,
  },
  link: {
    color: appTheme.colors.indigo,
    textDecorationLine: "underline",
  },
});
