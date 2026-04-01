import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { ErrorState } from "@/src/components/ui/error-state";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useAuth } from "@/src/hooks/use-auth";
import { useToast } from "@/src/hooks/use-toast";
import { getAuthErrorMessage } from "@/src/lib/api/error-utils";
import type { OnboardingRole } from "@/src/lib/types/auth";

type RoleOption = {
  value: OnboardingRole;
  title: string;
  description: string;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "FAMILY",
    title: "Família",
    description: "Publicar vagas, convidar profissionais e conduzir contratações.",
  },
  {
    value: "PROFESSIONAL",
    title: "Profissional",
    description: "Encontrar vagas, enviar candidaturas e gerir disponibilidade.",
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding, status } = useAuth();
  const toast = useToast();

  const [role, setRole] = useState<OnboardingRole>("FAMILY");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);

    if (!acceptTerms || !acceptPrivacy) {
      const message = "Você precisa aceitar os Termos e a Política de Privacidade para continuar.";
      setError(message);
      toast.warning("Aceite obrigatório", message);
      return;
    }

    try {
      await completeOnboarding({
        role,
        acceptTerms: true,
        acceptPrivacy: true,
      });
      toast.success("Onboarding concluído", "Seu perfil foi configurado com sucesso.");
    } catch (unknownError) {
      const message = getAuthErrorMessage(unknownError);
      setError(message);
      toast.error("Falha ao concluir onboarding.", message);
    }
  };

  return (
    <ScreenShell
      title="Defina seu papel"
      subtitle="Escolha como você quer usar a Cuidou e aceite os termos legais para continuar."
    >
      <View style={styles.stack}>
        {error ? <ErrorState title="Onboarding não concluído" description={error} /> : null}

        <View style={styles.roles}>
          {ROLE_OPTIONS.map((option) => {
            const selected = role === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                onPress={() => setRole(option.value)}
                style={[
                  styles.roleCard,
                  selected && styles.roleCardSelected,
                ]}
              >
                <Text style={styles.roleTitle}>{option.title}</Text>
                <Text style={styles.roleDescription}>{option.description}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.checkboxRow} onPress={() => setAcceptTerms((current) => !current)}>
          <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]} />
          <Text style={styles.checkboxText}>
            Aceito os{" "}
            <Link href="/(public)/terms" style={styles.link}>
              Termos de Uso
            </Link>
            .
          </Text>
        </Pressable>

        <Pressable
          style={styles.checkboxRow}
          onPress={() => setAcceptPrivacy((current) => !current)}
        >
          <View style={[styles.checkbox, acceptPrivacy && styles.checkboxChecked]} />
          <Text style={styles.checkboxText}>
            Aceito a{" "}
            <Link href="/(public)/privacy" style={styles.link}>
              Política de Privacidade
            </Link>
            .
          </Text>
        </Pressable>

        <Button
          label="Finalizar onboarding"
          onPress={submit}
          loading={status === "refreshing"}
          disabled={status === "authenticating"}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: appTheme.spacing.md,
  },
  roles: {
    gap: appTheme.spacing.sm,
  },
  roleCard: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.md,
    gap: 6,
  },
  roleCardSelected: {
    borderColor: appTheme.colors.indigo,
    backgroundColor: "rgba(73,98,199,0.08)",
  },
  roleTitle: {
    color: appTheme.colors.navy,
    fontWeight: appTheme.typography.weight.semibold,
    fontSize: appTheme.typography.size.lg,
  },
  roleDescription: {
    color: appTheme.colors.text,
    lineHeight: 21,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    paddingVertical: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 6,
    backgroundColor: appTheme.colors.white,
  },
  checkboxChecked: {
    backgroundColor: appTheme.colors.indigo,
    borderColor: appTheme.colors.indigo,
  },
  checkboxText: {
    flex: 1,
    color: appTheme.colors.text,
    lineHeight: 21,
    fontSize: appTheme.typography.size.sm,
  },
  link: {
    color: appTheme.colors.indigo,
    textDecorationLine: "underline",
  },
});
