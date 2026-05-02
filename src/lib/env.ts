export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (value) {
    return value;
  }

  throw new Error(`${name} environment variable is required.`);
}

export function getRequiredProductionEnv(name: string, devFallback?: string): string {
  const value = process.env[name];
  if (value) {
    return value;
  }

  if (process.env.NODE_ENV !== "production" && devFallback) {
    return devFallback;
  }

  throw new Error(`${name} environment variable is required in production.`);
}

export function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    getRequiredProductionEnv("AUTH_SECRET", "dev-secret-local-only-change-in-prod")
  );
}
