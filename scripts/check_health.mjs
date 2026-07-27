const defaultPort = process.env.PLAYWRIGHT_PORT ?? "3000";
const healthUrl = process.env.HEALTHCHECK_URL ?? `http://127.0.0.1:${defaultPort}/api/health`;

try {
  const response = await fetch(healthUrl);
  const body = await response.json();

  if (!body || !["ok", "degraded"].includes(body.status)) {
    throw new Error(`Resposta inválida: ${JSON.stringify(body)}`);
  }

  console.log(`Health ${body.status}: ${JSON.stringify(body)}`);
  process.exitCode = body.status === "ok" ? 0 : 1;
} catch (error) {
  console.error(`Não foi possível consultar ${healthUrl}.`, error);
  process.exitCode = 1;
}
