import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { validateExternalUrl } from "@/lib/file-validation";
import fs from "node:fs/promises";
import path from "node:path";

const WORDPRESS_URL = process.env.WORDPRESS_URL;
const WP_USER = process.env.WP_USER;
const WP_APP_PASS = process.env.WP_APP_PASS;

/** Prefix used to identify locally-stored uploads (legacy — kept for backward compatibility with existing DB records). */
const LOCAL_UPLOAD_SCHEME = "local-upload:";

function getLocalUploadDir(): string {
  return process.env.LOCAL_UPLOAD_DIR ?? "./uploads";
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function isWordPressConfigured(): boolean {
  return Boolean(WORDPRESS_URL && WP_USER && WP_APP_PASS);
}

function ensureWordPressEnv() {
  if (!WORDPRESS_URL) {
    throw new Error("WORDPRESS_URL is not configured");
  }

  if (!WP_USER || !WP_APP_PASS) {
    throw new Error("WP_USER and WP_APP_PASS are required for WordPress uploads");
  }
}

function toBasicAuthHeader() {
  ensureWordPressEnv();
  const credentials = `${WP_USER}:${WP_APP_PASS}`;
  const encoded = Buffer.from(credentials).toString("base64");
  return `Basic ${encoded}`;
}

function buildWordPressMediaEndpoint(pathname: string) {
  ensureWordPressEnv();
  const base = WORDPRESS_URL!.endsWith("/") ? WORDPRESS_URL!.slice(0, -1) : WORDPRESS_URL!;
  return `${base}${pathname}`;
}

/** Validate that a URL belongs to the configured WordPress hostname (SSRF protection). */
function validateWordPressUrl(url: string): void {
  const ssrfCheck = validateExternalUrl(url);
  if (!ssrfCheck.ok) {
    throw new Error(`SSRF protection: ${ssrfCheck.error}`);
  }

  if (WORDPRESS_URL) {
    try {
      const allowed = new URL(WORDPRESS_URL);
      const target = new URL(url);
      if (target.hostname !== allowed.hostname) {
        throw new Error(
          `SSRF protection: URL hostname "${target.hostname}" is not the configured WordPress host`,
        );
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("SSRF protection")) {
        throw e;
      }
      // If WORDPRESS_URL is not a valid URL itself, skip hostname check
    }
  }
}

export type UploadWordPressMediaParams = {
  buffer: Uint8Array;
  fileName: string;
  mimeType?: string;
  folderTag?: string;
  title?: string;
};

export type WordPressMediaUploadResult = {
  /** WordPress media ID. */
  mediaId: number;
  /** WordPress source URL. */
  sourceUrl: string;
  /** Opaque pathname to store in the DB (e.g. `wp-media:{id}`). */
  pathname: string;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
};

export async function uploadMediaToWordPress(
  params: UploadWordPressMediaParams,
): Promise<WordPressMediaUploadResult> {
  const safeName = sanitizeFileName(params.fileName);
  const prefixedName = params.folderTag
    ? `${sanitizeFileName(params.folderTag)}-${Date.now()}-${safeName}`
    : `${Date.now()}-${safeName}`;

  const endpoint = buildWordPressMediaEndpoint("/wp-json/wp/v2/media");
  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: {
      Authorization: toBasicAuthHeader(),
      "Content-Type": params.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename=\"${prefixedName}\"`,
    },
    body: Buffer.from(params.buffer),
    cache: "no-store",
    timeoutMs: 30_000, // uploads can be slower
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `WordPress upload failed (${response.status}): ${errorBody || response.statusText}`,
    );
  }

  const payload = (await response.json()) as {
    id?: number;
    source_url?: string;
    mime_type?: string;
  };

  if (!payload.id || !payload.source_url) {
    throw new Error("WordPress upload returned an invalid payload");
  }

  if (params.title) {
    try {
      const metaEndpoint = buildWordPressMediaEndpoint(`/wp-json/wp/v2/media/${payload.id}`);
      await fetchWithTimeout(metaEndpoint, {
        method: "POST",
        headers: {
          Authorization: toBasicAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: params.title }),
        cache: "no-store",
      });
    } catch {
      // Title metadata is best-effort and should not fail the upload.
    }
  }

  return {
    mediaId: payload.id,
    sourceUrl: payload.source_url,
    pathname: `wp-media:${payload.id}`,
    mimeType: payload.mime_type || params.mimeType || "application/octet-stream",
    fileName: safeName,
    sizeBytes: params.buffer.byteLength,
  };
}

export async function deleteWordPressMedia(mediaId: number) {
  // mediaId 0 is the sentinel for locally-stored uploads; nothing to delete via WP.
  if (mediaId === 0) {
    return;
  }

  const endpoint = buildWordPressMediaEndpoint(`/wp-json/wp/v2/media/${mediaId}?force=true`);

  const response = await fetchWithTimeout(endpoint, {
    method: "DELETE",
    headers: {
      Authorization: toBasicAuthHeader(),
    },
    cache: "no-store",
  });

  if (!response.ok && response.status !== 404) {
    const errorBody = await response.text();
    throw new Error(
      `WordPress delete failed (${response.status}): ${errorBody || response.statusText}`,
    );
  }
}

export async function fetchWordPressMediaBinary(sourceUrl: string) {
  if (sourceUrl.startsWith(LOCAL_UPLOAD_SCHEME)) {
    const relpath = sourceUrl.slice(LOCAL_UPLOAD_SCHEME.length);
    const absPath = path.join(getLocalUploadDir(), relpath);
    const buffer = await fs.readFile(absPath);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(buffer);
        controller.close();
      },
    });
    return {
      stream,
      contentType: null,
      contentLength: String(buffer.byteLength),
    };
  }

  if (!sourceUrl.startsWith("http://") && !sourceUrl.startsWith("https://")) {
    throw new Error("Invalid WordPress source URL");
  }

  // SSRF protection: validate hostname is the configured WordPress host
  validateWordPressUrl(sourceUrl);

  const response = await fetchWithTimeout(sourceUrl, {
    method: "GET",
    headers: {
      Authorization: toBasicAuthHeader(),
    },
    cache: "no-store",
  });

  if (!response.ok || !response.body) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `WordPress media fetch failed (${response.status}): ${errorBody || response.statusText}`,
    );
  }

  return {
    stream: response.body,
    contentType: response.headers.get("content-type"),
    contentLength: response.headers.get("content-length"),
  };
}

/** Returns true if a stored reference points to a local (non-WordPress) upload. */
export function isLocalUploadRef(ref: string): boolean {
  return ref.startsWith(LOCAL_UPLOAD_SCHEME);
}

export function extractWordPressMediaId(pathname: string) {
  if (!pathname.startsWith("wp-media:")) {
    return null;
  }

  const idText = pathname.slice("wp-media:".length);
  const id = Number.parseInt(idText, 10);

  return Number.isFinite(id) && id > 0 ? id : null;
}
