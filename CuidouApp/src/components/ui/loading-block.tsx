import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";

type LoadingBlockProps = {
  label?: string;
};

export function LoadingBlock({ label = "Carregando..." }: LoadingBlockProps) {
  return (
    <View style={styles.root}>
      <ActivityIndicator color={appTheme.colors.indigo} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 140,
    justifyContent: "center",
    alignItems: "center",
    gap: appTheme.spacing.sm,
  },
  label: {
    fontSize: appTheme.typography.size.sm,
    color: appTheme.colors.textMuted,
  },
});
