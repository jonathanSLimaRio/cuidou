import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";

type ToastVariant = "success" | "error" | "warning" | "info";

type ToastItem = {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  show: (variant: ToastVariant, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function toastPalette(variant: ToastVariant) {
  if (variant === "success") {
    return { border: "#A9E5BF", text: appTheme.colors.success };
  }

  if (variant === "error") {
    return { border: "#F2B7C2", text: appTheme.colors.danger };
  }

  if (variant === "warning") {
    return { border: "#F4D49C", text: appTheme.colors.warning };
  }

  return { border: "#BFD4F6", text: appTheme.colors.info };
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (variant: ToastVariant, title: string, message?: string) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const item: ToastItem = { id, title, message, variant };
      setToasts((current) => [item, ...current].slice(0, 4));
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (title, message) => show("success", title, message),
      error: (title, message) => show("error", title, message),
      warning: (title, message) => show("warning", title, message),
      info: (title, message) => show("info", title, message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" style={styles.viewport}>
        {toasts.map((toast) => {
          const palette = toastPalette(toast.variant);
          return (
            <View
              key={toast.id}
              style={[
                styles.toast,
                {
                  borderColor: palette.border,
                },
              ]}
            >
              <View style={styles.toastHeader}>
                <Text style={[styles.toastTitle, { color: palette.text }]}>{toast.title}</Text>
                <Pressable accessibilityRole="button" onPress={() => dismiss(toast.id)}>
                  <Text style={styles.toastClose}>×</Text>
                </Pressable>
              </View>
              {toast.message ? <Text style={styles.toastMessage}>{toast.message}</Text> : null}
            </View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within ToastProvider");
  }

  return context;
}

const styles = StyleSheet.create({
  viewport: {
    position: "absolute",
    top: 56,
    left: 12,
    right: 12,
    gap: 8,
    zIndex: 100,
  },
  toast: {
    borderWidth: 1,
    borderRadius: appTheme.radius.md,
    backgroundColor: "rgba(255,255,255,0.98)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#10206D",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  toastHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  toastTitle: {
    fontSize: appTheme.typography.size.sm,
    fontWeight: appTheme.typography.weight.bold,
    flex: 1,
  },
  toastMessage: {
    marginTop: 4,
    fontSize: appTheme.typography.size.sm,
    color: appTheme.colors.text,
  },
  toastClose: {
    fontSize: 18,
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
});
