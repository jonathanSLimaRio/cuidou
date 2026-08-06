import { Platform } from "react-native";

export const appTheme = {
  colors: {
    background: "#F4F7FF",
    surface: "#FFFFFF",
    text: "#445388",
    textStrong: "#0D1A66",
    textMuted: "#586586",
    navy: "#212D71",
    indigo: "#4962C7",
    indigoStrong: "#0D1A66",
    pink: "#FFBFD0",
    sky: "#8FD5EF",
    mint: "#DBF4EC",
    yellow: "#FFD88A",
    border: "#D7DFF6",
    success: "#1F6C40",
    warning: "#A87316",
    danger: "#BE3E56",
    info: "#275DBF",
    white: "#FFFFFF",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    "2xl": 24,
    "3xl": 32,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    full: 999,
  },
  typography: {
    family: {
      regular: "System",
      display: "System",
      mono: "Courier",
    },
    size: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 22,
      "2xl": 28,
    },
    weight: {
      regular: "400" as const,
      medium: "500" as const,
      semibold: "600" as const,
      bold: "700" as const,
    },
  },
  shadow: {
    sm: {
      shadowColor: "#10206D",
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    md: {
      shadowColor: "#10206D",
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
  },
};

export type AppTheme = typeof appTheme;

export const Colors = {
  light: {
    text: appTheme.colors.text,
    background: appTheme.colors.background,
    tint: appTheme.colors.indigo,
    icon: appTheme.colors.textMuted,
    tabIconDefault: appTheme.colors.textMuted,
    tabIconSelected: appTheme.colors.indigo,
  },
  dark: {
    text: appTheme.colors.text,
    background: appTheme.colors.background,
    tint: appTheme.colors.indigo,
    icon: appTheme.colors.textMuted,
    tabIconDefault: appTheme.colors.textMuted,
    tabIconSelected: appTheme.colors.indigo,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Segoe UI', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
});
