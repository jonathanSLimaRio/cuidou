export const DOCUMENT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

export const DOCUMENT_ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"] as const;

export const DOCUMENT_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export function validateMimeType(
  mimeType: string,
  allowedTypes: readonly string[],
): { ok: true } | { ok: false; error: string } {
  if (!allowedTypes.includes(mimeType)) {
    return {
      ok: false,
      error: `File type "${mimeType}" is not allowed. Accepted: ${allowedTypes.join(", ")}`,
    };
  }
  return { ok: true };
}

export function validateFileSize(
  sizeBytes: number,
  maxBytes: number,
): { ok: true } | { ok: false; error: string } {
  if (sizeBytes > maxBytes) {
    return {
      ok: false,
      error: `File size ${sizeBytes} bytes exceeds maximum of ${maxBytes} bytes (${Math.round(maxBytes / 1024 / 1024)}MB)`,
    };
  }
  return { ok: true };
}

export function validateFileExtension(
  filename: string,
  allowedExts: readonly string[],
): { ok: true } | { ok: false; error: string } {
  const lower = filename.toLowerCase();
  const hasAllowed = allowedExts.some((ext) => lower.endsWith(ext));
  if (!hasAllowed) {
    return {
      ok: false,
      error: `File extension not allowed. Accepted: ${allowedExts.join(", ")}`,
    };
  }
  return { ok: true };
}

export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 200);
}

// Validate that a URL is not pointing to internal/private network (SSRF protection)
const PRIVATE_IP_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/10\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^https?:\/\/0\.0\.0\.0/,
  /^https?:\/\/\[::1\]/,
];

export function validateExternalUrl(url: string): { ok: true } | { ok: false; error: string } {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false, error: "URL must use http or https protocol" };
    }
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(url)) {
        return { ok: false, error: "URL points to a private/internal network address" };
      }
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Invalid URL format" };
  }
}
