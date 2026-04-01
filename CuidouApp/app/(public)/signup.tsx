import { Link } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

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

  const onSubmit = async () => {
    setError(null);

    if (!name.trim()) {
      setError("Informe seu nome completo.");
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

    setLoading(true);
    try {
      const result = await signUp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
      });

      toast.success("Cadastro enviado", result.message);
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (unknownError) {
      const message = getAuthErrorMessage(unknownError);
      setError(message);
      toast.error("Não foi possível criar a conta.", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      title="Criar cadastro local"
      subtitle="Seu cadastro ficará pendente até aprovação administrativa."
    >
      <View style={styles.form}>
        {error ? <ErrorState title="Falha no cadastro" description={error} /> : null}

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
        <Input
          label="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
        />
        <Input
          label="Confirmar senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          placeholder="Repita sua senha"
        />

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
  footer: {
    marginTop: appTheme.spacing.sm,
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
  },
  footerLink: {
    color: appTheme.colors.indigo,
    fontWeight: appTheme.typography.weight.semibold,
  },
});
