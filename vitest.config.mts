import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/lib/__tests__/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/__tests__/**", "src/lib/prisma.ts"],
      thresholds: {
        statements: 60,
        lines: 60,
        branches: 50,
        functions: 50,
        "src/lib/auth-guard.ts": {
          lines: 80,
        },
        "src/lib/legal-consent.ts": {
          lines: 80,
        },
        "src/lib/mobile-auth.ts": {
          lines: 80,
        },
        "src/lib/rate-limiter.ts": {
          lines: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": `${import.meta.dirname}/src`,
    },
  },
});
