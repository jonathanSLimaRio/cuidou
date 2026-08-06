import { appConfig } from "@/src/lib/config";
import { getAccessToken } from "@/src/lib/session/runtime-session";
import type { ApiErrorResponse } from "@/src/lib/types/auth";

const REQUEST_TIMEOUT_MS = 10_000;

type Primitive = string | number | boolean;
type QueryValue = Primitive | null | undefined;

export type ApiRequestOptions = RequestInit & {
  auth?: boolean;
  retryAuth?: boolean;
  query?: Record<string, QueryValue>;
  json?: unknown;
  timeoutMs?: number;
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type AuthHooks = {
  refreshSession: () => Promise<boolean>;
  onUnauthorized: () => Promise<void> | void;
};

const authHooks: AuthHooks = {
  refreshSession: async () => false,
  onUnauthorized: () => undefined,
};

export function registerApiAuthHooks(hooks: Partial<AuthHooks>) {
  if (hooks.refreshSession) {
    authHooks.refreshSession = hooks.refreshSession;
  }

  if (hooks.onUnauthorized) {
    authHooks.onUnauthorized = hooks.onUnauthorized;
  }
}

function normalizePath(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const baseUrl = appConfig.apiBaseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

function withQuery(path: string, query?: Record<string, QueryValue>) {
  if (!query) {
    return path;
  }

  const url = new URL(path);
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function toHeaders(headers?: HeadersInit) {
  const nextHeaders = new Headers(headers);
  nextHeaders.set("Accept", "application/json");
  nextHeaders.set("x-cuidou-client", "mobile");
  return nextHeaders;
}

async function parseResponsePayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return (await response.json()) as unknown;
    } catch {
      return null;
    }
  }

  if (response.status === 204) {
    return null;
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
}

function parseErrorPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload as ApiErrorResponse;
}

async function executeRequest(path: string, options: ApiRequestOptions) {
  const url = withQuery(normalizePath(path), options.query);
  const headers = toHeaders(options.headers);
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;

  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      headers,
      body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const authEnabled = options.auth ?? false;
  const retryAuth = options.retryAuth ?? true;

  let response = await executeRequest(path, options);

  if (response.status === 401 && authEnabled && retryAuth) {
    const refreshed = await authHooks.refreshSession();
    if (refreshed) {
      response = await executeRequest(path, { ...options, retryAuth: false });
    } else {
      await authHooks.onUnauthorized();
    }
  }

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    const errorPayload = parseErrorPayload(payload);
    throw new ApiClientError(
      response.status,
      errorPayload?.error ??
        errorPayload?.message ??
        `Request failed with status ${response.status}`,
      errorPayload?.code,
      errorPayload?.details,
    );
  }

  return payload as T;
}
