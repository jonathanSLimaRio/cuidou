import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from "react-native";

import { appTheme } from "@/constants/theme";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
};

function getButtonColors(variant: ButtonVariant, disabled: boolean) {
  if (variant === "secondary") {
    return {
      backgroundColor: disabled ? "#EEF1FA" : appTheme.colors.white,
      borderColor: appTheme.colors.border,
      textColor: appTheme.colors.indigo,
    };
  }

  if (variant === "ghost") {
    return {
      backgroundColor: "transparent",
      borderColor: "transparent",
      textColor: appTheme.colors.indigo,
    };
  }

  return {
    backgroundColor: disabled ? "#A7B5EA" : appTheme.colors.indigo,
    borderColor: disabled ? "#A7B5EA" : appTheme.colors.indigo,
    textColor: appTheme.colors.white,
  };
}

export function Button({
  label,
  loading = false,
  disabled,
  variant = "primary",
  style,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);
  const palette = getButtonColors(variant, isDisabled);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={(state) => [
        styles.button,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: isDisabled && variant === "ghost" ? 0.6 : 1,
        },
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={palette.textColor} size="small" />
      ) : (
        <Text style={[styles.label, { color: palette.textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: appTheme.radius.full,
    paddingHorizontal: appTheme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: appTheme.typography.size.md,
    fontWeight: appTheme.typography.weight.semibold,
  },
});
