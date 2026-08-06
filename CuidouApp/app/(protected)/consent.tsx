import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { ErrorState } from "@/src/components/ui/error-state";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useAuth } from "@/src/hooks/use-auth";

export default function ConsentScreen() {
  const { acceptCurrentLegalConsent, status } = useAuth();
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!terms || !privacy) {
      setError("Leia e aceite os dois documentos para continuar.");
      return;
    }
    setError(null);
    try {
      await acceptCurrentLegalConsent();
    } catch {
      setError("Não foi possível registrar seu aceite. Tente novamente.");
    }
  }

  return (
    <ScreenShell title="Privacidade e transparência" subtitle="Revise os documentos atuais antes de continuar.">
      <View style={styles.stack}>
        {error ? <ErrorState title="Aceite pendente" description={error} /> : null}
        <ConsentRow checked={terms} onPress={() => setTerms((value) => !value)} label="Termos de Uso" href="/(public)/terms" />
        <ConsentRow checked={privacy} onPress={() => setPrivacy((value) => !value)} label="Política de Privacidade" href="/(public)/privacy" />
        <Button label="Aceitar e continuar" onPress={submit} loading={status === "refreshing"} />
      </View>
    </ScreenShell>
  );
}

function ConsentRow({ checked, onPress, label, href }: { checked: boolean; onPress: () => void; label: string; href: "/(public)/terms" | "/(public)/privacy" }) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={`Aceitar ${label}`} onPress={onPress} style={[styles.checkbox, checked && styles.checked]}>
        <Text style={styles.mark}>{checked ? "✓" : ""}</Text>
      </Pressable>
      <Text style={styles.text}>Li e aceito: </Text>
      <Link href={href} style={styles.link}>{label}</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: appTheme.spacing.md },
  row: { minHeight: 56, flexDirection: "row", flexWrap: "wrap", alignItems: "center", padding: appTheme.spacing.sm, borderWidth: 1, borderColor: appTheme.colors.border, borderRadius: appTheme.radius.md, backgroundColor: appTheme.colors.surface },
  checkbox: { width: 44, height: 44, marginRight: appTheme.spacing.sm, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: appTheme.colors.border, borderRadius: 12 },
  checked: { backgroundColor: appTheme.colors.indigo, borderColor: appTheme.colors.indigo },
  mark: { color: appTheme.colors.white, fontSize: 20, fontWeight: "700" },
  text: { color: appTheme.colors.text, fontSize: appTheme.typography.size.sm },
  link: { color: appTheme.colors.indigo, textDecorationLine: "underline", fontWeight: "600" },
});
