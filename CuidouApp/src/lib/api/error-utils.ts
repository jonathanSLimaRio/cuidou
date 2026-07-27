import { ApiClientError } from "@/src/lib/api/client";
import type { AuthErrorCode } from "@/src/lib/types/auth";

function normalizeCode(code: string | undefined): AuthErrorCode | undefined {
  if (!code) {
    return undefined;
  }

  if (
    code === "pending_approval" ||
    code === "account_suspended" ||
    code === "account_banned" ||
    code === "credentials_invalid" ||
    code === "unauthorized" ||
    code === "account_inactive" ||
    code === "refresh_token_invalid" ||
    code === "google_not_configured" ||
    code === "google_token_invalid"
  ) {
    return code;
  }

  return undefined;
}

export function getAuthErrorCode(error: unknown): AuthErrorCode | undefined {
  if (!(error instanceof ApiClientError)) {
    return undefined;
  }

  const normalizedCode = normalizeCode(error.code);
  if (normalizedCode) {
    return normalizedCode;
  }

  if (error.status === 401) {
    return "credentials_invalid";
  }

  if (error.status === 403) {
    return "unauthorized";
  }

  return undefined;
}

export function getAuthErrorMessage(error: unknown) {
  const code = getAuthErrorCode(error);

  if (code === "pending_approval") {
    return "Sua conta está pendente de aprovação administrativa.";
  }

  if (code === "account_suspended") {
    return "Sua conta está suspensa. Entre em contato com o suporte.";
  }

  if (code === "account_banned") {
    return "Sua conta foi banida e não pode acessar a plataforma.";
  }

  if (code === "credentials_invalid") {
    return "Email ou senha inválidos.";
  }

  if (code === "unauthorized") {
    return "Você não tem permissão para acessar este recurso.";
  }

  if (code === "account_inactive" || code === "refresh_token_invalid") {
    return "Sua sessão expirou. Entre novamente para continuar.";
  }

  if (code === "google_not_configured") {
    return "O login Google ainda não está configurado neste ambiente.";
  }

  if (code === "google_token_invalid") {
    return "Não foi possível validar sua conta Google.";
  }

  if (error instanceof ApiClientError) {
    return error.message;
  }

  return "Não foi possível concluir a ação. Tente novamente.";
}
