import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const rawRequestId = request.headers["x-request-id"];
  const requestId = Array.isArray(rawRequestId) ? rawRequestId[0] : rawRequestId;

  Sentry.withScope((scope) => {
    if (requestId) scope.setTag("request_id", requestId);
    scope.setTag("route", context.routePath);
    Sentry.captureRequestError(error, request, context);
  });
};
