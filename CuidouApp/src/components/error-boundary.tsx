import { Component, type PropsWithChildren, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { captureSentryException } from "@/src/lib/sentry";

type Props = PropsWithChildren<{
  fallback?: ReactNode;
}>;

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    captureSentryException(error, {
      source: "mobile_error_boundary",
      hasComponentStack: Boolean(info.componentStack),
    });

    if (__DEV__) {
      console.error("[ErrorBoundary]", {
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>!</Text>
          <Text style={styles.title}>Algo deu errado</Text>
          <Text style={styles.subtitle}>
            Ocorreu um erro inesperado. Por favor, tente novamente.
          </Text>
          {__DEV__ && this.state.error ? (
            <Text style={styles.devError}>{this.state.error.message}</Text>
          ) : null}
          <Pressable style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a2e",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  devError: {
    fontSize: 11,
    color: "#dc2626",
    backgroundColor: "#fef2f2",
    padding: 8,
    borderRadius: 8,
    fontFamily: "monospace",
    maxWidth: 320,
  },
  button: {
    marginTop: 8,
    backgroundColor: "#6c4fc4",
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
