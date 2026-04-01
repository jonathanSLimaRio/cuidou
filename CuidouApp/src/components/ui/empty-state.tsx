import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
  },
  title: {
    fontSize: appTheme.typography.size.lg,
    color: appTheme.colors.navy,
    fontWeight: appTheme.typography.weight.semibold,
  },
  description: {
    fontSize: appTheme.typography.size.md,
    color: appTheme.colors.textMuted,
    lineHeight: 21,
  },
});
