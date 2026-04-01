import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";

type ErrorStateProps = {
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title,
  description,
  retryLabel = "Tentar novamente",
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {onRetry ? <Button label={retryLabel} onPress={onRetry} style={styles.button} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderColor: "#F2B7C2",
    borderRadius: appTheme.radius.md,
    backgroundColor: "rgba(190,62,86,0.08)",
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
  },
  title: {
    fontSize: appTheme.typography.size.lg,
    color: appTheme.colors.danger,
    fontWeight: appTheme.typography.weight.semibold,
  },
  description: {
    fontSize: appTheme.typography.size.md,
    color: appTheme.colors.text,
    lineHeight: 21,
  },
  button: {
    marginTop: appTheme.spacing.sm,
    alignSelf: "flex-start",
    minWidth: 170,
  },
});
