import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";

import { appTheme } from "@/constants/theme";

type InputProps = TextInputProps & {
  label: string;
  error?: string | null;
};

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: error ? "#F2B7C2" : appTheme.colors.border,
          },
          style,
        ]}
        placeholderTextColor={appTheme.colors.textMuted}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 6,
  },
  label: {
    fontSize: appTheme.typography.size.sm,
    color: appTheme.colors.textMuted,
    fontWeight: appTheme.typography.weight.semibold,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    color: appTheme.colors.textStrong,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    fontSize: appTheme.typography.size.md,
  },
  error: {
    color: appTheme.colors.danger,
    fontSize: appTheme.typography.size.sm,
  },
});
