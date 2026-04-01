import "react-native-reanimated";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { AuthProvider } from "@/src/providers/auth-provider";
import { AppQueryProvider } from "@/src/providers/query-provider";
import { AppThemeProvider } from "@/src/providers/theme-provider";
import { ToastProvider } from "@/src/providers/toast-provider";

export default function RootLayout() {
  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <AppQueryProvider>
          <ToastProvider>
            <AuthProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(public)" />
                <Stack.Screen name="(marketplace)" />
                <Stack.Screen name="(protected)" />
                <Stack.Screen name="(family)" />
                <Stack.Screen name="(professional)" />
                <Stack.Screen name="(admin)" />
              </Stack>
            </AuthProvider>
          </ToastProvider>
        </AppQueryProvider>
      </AppThemeProvider>
      <StatusBar style="dark" />
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
