import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { appTheme } from "@/constants/theme";

type ScreenShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  scrollable?: boolean;
};

export function ScreenShell({
  title,
  subtitle,
  children,
  scrollable = true,
}: ScreenShellProps) {
  const content = (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.card}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        {scrollable ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.xl,
    gap: appTheme.spacing.lg,
  },
  hero: {
    gap: appTheme.spacing.sm,
  },
  title: {
    fontSize: appTheme.typography.size["2xl"],
    fontWeight: appTheme.typography.weight.bold,
    color: appTheme.colors.navy,
    lineHeight: 34,
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.md,
    lineHeight: 22,
  },
  card: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
  },
});
