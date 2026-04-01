import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { ScreenShell } from "@/src/components/ui/screen-shell";

const sections = [
  {
    title: "1. Dados coletados",
    body: "Coletamos dados de identificação e contato (nome, e-mail, telefone), informações de perfil, conteúdos de vagas, candidaturas, mensagens, documentos enviados para verificação e eventos de segurança.",
  },
  {
    title: "2. Finalidades de tratamento",
    body: "Utilizamos os dados para operação do marketplace, autenticação, moderação, prevenção a fraude, notificações transacionais e melhoria da experiência do produto.",
  },
  {
    title: "3. Base legal (LGPD)",
    body: "O tratamento de dados pode ocorrer por execução de contrato, cumprimento de obrigação legal, exercício regular de direitos e legítimo interesse, conforme a natureza de cada fluxo.",
  },
  {
    title: "4. Compartilhamento de dados",
    body: "Dados podem ser compartilhados com provedores de infraestrutura e comunicação estritamente necessários para operar o serviço (ex.: autenticação, banco de dados, notificações e armazenamento de arquivos).",
  },
  {
    title: "5. Retenção e segurança",
    body: "Mantemos os dados pelo tempo necessário para cumprir finalidades legais e operacionais, adotando medidas técnicas e administrativas para proteção contra acesso não autorizado.",
  },
  {
    title: "6. Direitos do titular",
    body: "Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação e revisão, nos limites da legislação aplicável.",
  },
];

export default function PrivacyScreen() {
  return (
    <ScreenShell
      title="Política de Privacidade"
      subtitle="Como a Cuidou coleta, usa e protege dados pessoais. Última atualização: 29/03/2026."
    >
      <View style={styles.stack}>
        {sections.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardBody}>{section.body}</Text>
          </View>
        ))}
        <Text style={styles.footer}>
          Solicitações de privacidade podem ser enviadas para{" "}
          <Link href="mailto:privacidade@cuidou.app" style={styles.link}>
            privacidade@cuidou.app
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
