import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { ErrorState } from "@/src/components/ui/error-state";
import { Input } from "@/src/components/ui/input";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useAuth } from "@/src/hooks/use-auth";
import { useToast } from "@/src/hooks/use-toast";
import { getAuthErrorMessage } from "@/src/lib/api/error-utils";

function validatePassword(value: string) {
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  return value.length >= 8 && hasLetter && hasNumber;
}

export default function SignupScreen() {
  const { signUp } = useAuth();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [role, setRole] = useState<"FAMILY" | "PROFESSIONAL" | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async () => {
    setError(null);

    if (!name.trim()) {
      setError("Informe seu nome completo.");
      return;
    }

    if (!role) {
      setError("Escolha se você quer contratar ou trabalhar.");
      return;
    }

    if (!validatePassword(password)) {
      setError("A senha deve ter ao menos 8 caracteres, incluindo letra e número.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      setError("Leia e aceite os Termos de Uso e a Política de Privacidade.");
      return;
    }

    setLoading(true);
    try {
      const result = await signUp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        acceptedTerms: true,
        acceptedPrivacy: true,
        role,
      });

      toast.success("Cadastro enviado", result.message);
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setAcceptedTerms(false);
      setAcceptedPrivacy(false);
      setSubmitted(true);
    } catch (unknownError) {
      const message = getAuthErrorMessage(unknownError);
      setError(message);
      toast.error("Não foi possível criar a conta.", message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <ScreenShell
        title="Cadastro recebido"
        subtitle="Sua conta está pendente de aprovação administrativa."
      >
        <View style={styles.confirmation} accessibilityRole="summary">
          <Text style={styles.confirmationTitle}>Próximas etapas</Text>
          <Text style={styles.confirmationText}>
            A equipe analisará o cadastro. Não há prazo automático de liberação; quando a conta
            estiver ativa, entre novamente para concluir seu perfil e começar a usar a Cuidou.
          </Text>
          <Link href="/(public)/login" style={styles.confirmationLink}>Ir para o login</Link>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title="Criar cadastro local"
      subtitle="Seu cadastro ficará pendente até aprovação administrativa."
    >
      <View style={styles.form}>
        {error ? <ErrorState title="Falha no cadastro" description={error} /> : null}

        <View style={styles.roleGroup} accessibilityRole="radiogroup" accessibilityLabel="Tipo de perfil">
          <Text style={styles.roleLegend}>Como você quer usar a Cuidou?</Text>
          <View style={styles.roleOptions}>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: role === "FAMILY" }}
              onPress={() => setRole("FAMILY")}
              style={[styles.roleOption, role === "FAMILY" && styles.roleOptionSelected]}
            >
              <Text style={styles.roleTitle}>Preciso contratar</Text>
              <Text style={styles.roleDescription}>Perfil de família</Text>
            </Pressable>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: role === "PROFESSIONAL" }}
              onPress={() => setRole("PROFESSIONAL")}
              style={[styles.roleOption, role === "PROFESSIONAL" && styles.roleOptionSelected]}
            >
              <Text style={styles.roleTitle}>Quero trabalhar</Text>
              <Text style={styles.roleDescription}>Perfil profissional</Text>
            </Pressable>
          </View>
        </View>

        <Input
          label="Nome"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          placeholder="Seu nome completo"
        />

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="voce@exemplo.com"
        />
        <Text style={styles.passwordHint}>
          Use pelo menos 8 caracteres, com uma letra e um número.
        </Text>
        <Input
          label="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPasswords}
          autoCapitalize="none"
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
        />
        <Input
          label="Confirmar senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPasswords}
          autoCapitalize="none"
          autoComplete="new-password"
          placeholder="Repita sua senha"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showPasswords ? "Ocultar senhas" : "Mostrar senhas"}
          onPress={() => setShowPasswords((value) => !value)}
          style={styles.passwordToggle}
        >
          <Text style={styles.passwordToggleText}>{showPasswords ? "Ocultar senhas" : "Mostrar senhas"}</Text>
        </Pressable>

        <View style={styles.consentRow}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedTerms }}
            accessibilityLabel="Aceitar os Termos de Uso"
            onPress={() => setAcceptedTerms((value) => !value)}
            style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}
          >
            <Text style={styles.checkmark}>{acceptedTerms ? "✓" : ""}</Text>
          </Pressable>
          <Text style={styles.consentText}>Li e aceito os </Text>
          <Link href="/(public)/terms" style={styles.footerLink}>Termos de Uso</Link>
          <Text style={styles.consentText}>.</Text>
        </View>

        <View style={styles.consentRow}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedPrivacy }}
            accessibilityLabel="Aceitar a Política de Privacidade"
            onPress={() => setAcceptedPrivacy((value) => !value)}
            style={[styles.checkbox, acceptedPrivacy && styles.checkboxChecked]}
          >
            <Text style={styles.checkmark}>{acceptedPrivacy ? "✓" : ""}</Text>
          </Pressable>
          <Text style={styles.consentText}>Li e aceito a </Text>
          <Link href="/(public)/privacy" style={styles.footerLink}>Política de Privacidade</Link>
          <Text style={styles.consentText}>.</Text>
        </View>

        <Button label="Criar conta" onPress={onSubmit} loading={loading} />

        <Text style={styles.footer}>
          Já possui conta?{" "}
          <Link href="/(public)/login" style={styles.footerLink}>
            Fazer login
          </Link>
        </Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: appTheme.spacing.md,
  },
  roleGroup: { gap: appTheme.spacing.sm },
  roleLegend: {
    color: appTheme.colors.textStrong,
    fontSize: appTheme.typography.size.sm,
    fontWeight: appTheme.typography.weight.semibold,
  },
  roleOptions: { flexDirection: "row", gap: appTheme.spacing.sm },
  roleOption: {
    flex: 1,
    minHeight: 72,
    justifyContent: "center",
    gap: appTheme.spacing.xs,
    borderWidth: 2,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.md,
  },
  roleOptionSelected: { borderColor: appTheme.colors.indigo, backgroundColor: appTheme.colors.background },
  roleTitle: { color: appTheme.colors.textStrong, fontWeight: appTheme.typography.weight.bold },
  roleDescription: { color: appTheme.colors.textMuted, fontSize: appTheme.typography.size.sm },
  passwordToggle: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
    paddingHorizontal: appTheme.spacing.md,
  },
  passwordToggleText: { color: appTheme.colors.indigo, fontWeight: appTheme.typography.weight.semibold },
  passwordHint: { color: appTheme.colors.textMuted, fontSize: appTheme.typography.size.sm, lineHeight: 20 },
  confirmation: {
    gap: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.xl,
  },
  confirmationTitle: { color: appTheme.colors.textStrong, fontSize: appTheme.typography.size.xl, fontWeight: appTheme.typography.weight.bold },
  confirmationText: { color: appTheme.colors.text, fontSize: appTheme.typography.size.md, lineHeight: 24 },
  confirmationLink: { minHeight: 44, color: appTheme.colors.indigo, fontWeight: appTheme.typography.weight.bold, paddingVertical: appTheme.spacing.md },
  footer: {
    marginTop: appTheme.spacing.sm,
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
  },
  footerLink: {
    color: appTheme.colors.indigo,
    fontWeight: appTheme.typography.weight.semibold,
  },
  consentRow: {
    minHeight: 44,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  checkbox: {
    width: 44,
    height: 44,
    marginRight: appTheme.spacing.xs,
    borderWidth: 2,
    borderColor: appTheme.colors.border,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: appTheme.colors.indigo,
    borderColor: appTheme.colors.indigo,
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  consentText: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.sm,
  },
});
