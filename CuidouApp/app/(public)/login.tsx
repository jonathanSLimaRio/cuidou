import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { ErrorState } from "@/src/components/ui/error-state";
import { Input } from "@/src/components/ui/input";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useAuth } from "@/src/hooks/use-auth";
import { useToast } from "@/src/hooks/use-toast";
import { appConfig } from "@/src/lib/config";
import { getAuthErrorMessage } from "@/src/lib/api/error-utils";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { signInWithPassword, signInWithGoogle, status } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: appConfig.google.iosClientId || undefined,
    androidClientId: appConfig.google.androidClientId || undefined,
    webClientId: appConfig.google.webClientId || undefined,
    selectAccount: true,
  });

  const hasGoogleConfig = useMemo(
    () =>
      Boolean(
        appConfig.google.iosClientId ||
          appConfig.google.androidClientId ||
          appConfig.google.webClientId,
      ),
    [],
  );

  useEffect(() => {
    if (response?.type !== "success") {
      return;
    }

    const idToken = response.authentication?.idToken ?? response.params?.id_token;
    if (!idToken) {
      toast.error("Falha no login Google", "Não foi possível obter o token de autenticação.");
      return;
    }

    const runExchange = async () => {
      setGoogleLoading(true);
      setLocalError(null);
      try {
        await signInWithGoogle(idToken);
      } catch (error) {
        const message = getAuthErrorMessage(error);
        setLocalError(message);
        toast.error("Não foi possível entrar com Google.", message);
      } finally {
        setGoogleLoading(false);
      }
    };

    void runExchange();
  }, [response, signInWithGoogle, toast]);

  const handleCredentialsLogin = async () => {
    setLocalError(null);

    try {
      await signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setLocalError(message);
      toast.error("Falha no login.", message);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    const result = await promptAsync();

    if (result.type === "error") {
      toast.error("Falha no login Google", "Não foi possível abrir o provedor de autenticação.");
    }
  };

  return (
    <ScreenShell
      title="Entre na Cuidou"
      subtitle="Use email/senha ou Google para acessar sua conta com sessão persistente."
    >
      <View style={styles.form}>
        {localError ? (
          <ErrorState title="Não foi possível autenticar" description={localError} />
        ) : null}

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
          autoComplete="password"
          placeholder="Sua senha"
        />

        <Button
          label="Entrar com email e senha"
          onPress={handleCredentialsLogin}
          loading={status === "authenticating" && !googleLoading}
          disabled={!email || !password}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          label="Continuar com Google"
          onPress={handleGoogleLogin}
          loading={googleLoading}
          disabled={!request || !hasGoogleConfig || status === "authenticating"}
          variant="secondary"
        />

        <Link href="/(marketplace)/jobs" asChild>
          <Button label="Explorar marketplace sem login" variant="ghost" />
        </Link>

        {!hasGoogleConfig ? (
          <Text style={styles.helpText}>
            Configure `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` para habilitar login Google.
          </Text>
        ) : null}

        <Text style={styles.footer}>
          Ainda não tem conta?{" "}
          <Link href="/(public)/signup" style={styles.footerLink}>
            Criar cadastro
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
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: appTheme.spacing.sm,
  },
  dividerLine: {
    height: 1,
    backgroundColor: appTheme.colors.border,
    flex: 1,
  },
  dividerLabel: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
    textTransform: "uppercase",
  },
  helpText: {
    color: appTheme.colors.warning,
    fontSize: appTheme.typography.size.sm,
    lineHeight: 20,
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
