import { describe, expect, it } from "vitest";
import {
  DOCUMENT_ALLOWED_EXTENSIONS,
  DOCUMENT_ALLOWED_MIME_TYPES,
  DOCUMENT_MAX_SIZE_BYTES,
  sanitizeFileName,
  validateExternalUrl,
  validateFileExtension,
  validateFileSize,
  validateMimeType,
} from "../file-validation";

describe("validateMimeType", () => {
  it("allows PDF", () => {
    expect(validateMimeType("application/pdf", DOCUMENT_ALLOWED_MIME_TYPES).ok).toBe(true);
  });

  it("allows JPEG", () => {
    expect(validateMimeType("image/jpeg", DOCUMENT_ALLOWED_MIME_TYPES).ok).toBe(true);
  });

  it("allows PNG", () => {
    expect(validateMimeType("image/png", DOCUMENT_ALLOWED_MIME_TYPES).ok).toBe(true);
  });

  it("rejects SVG", () => {
    const result = validateMimeType("image/svg+xml", DOCUMENT_ALLOWED_MIME_TYPES);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("image/svg+xml");
  });

  it("rejects executable", () => {
    expect(validateMimeType("application/x-executable", DOCUMENT_ALLOWED_MIME_TYPES).ok).toBe(false);
  });
});

describe("validateFileSize", () => {
  it("allows file within limit", () => {
    expect(validateFileSize(1024 * 1024, DOCUMENT_MAX_SIZE_BYTES).ok).toBe(true); // 1MB
  });

  it("allows exactly at the limit", () => {
    expect(validateFileSize(DOCUMENT_MAX_SIZE_BYTES, DOCUMENT_MAX_SIZE_BYTES).ok).toBe(true);
  });

  it("rejects file over limit", () => {
    const result = validateFileSize(DOCUMENT_MAX_SIZE_BYTES + 1, DOCUMENT_MAX_SIZE_BYTES);
    expect(result.ok).toBe(false);
  });
});

describe("validateFileExtension", () => {
  it("allows .pdf", () => {
    expect(validateFileExtension("document.pdf", DOCUMENT_ALLOWED_EXTENSIONS).ok).toBe(true);
  });

  it("allows .jpg", () => {
    expect(validateFileExtension("photo.jpg", DOCUMENT_ALLOWED_EXTENSIONS).ok).toBe(true);
  });

  it("allows .jpeg", () => {
    expect(validateFileExtension("photo.jpeg", DOCUMENT_ALLOWED_EXTENSIONS).ok).toBe(true);
  });

  it("allows .png", () => {
    expect(validateFileExtension("image.png", DOCUMENT_ALLOWED_EXTENSIONS).ok).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(validateFileExtension("document.PDF", DOCUMENT_ALLOWED_EXTENSIONS).ok).toBe(true);
  });

  it("rejects .exe", () => {
    expect(validateFileExtension("malware.exe", DOCUMENT_ALLOWED_EXTENSIONS).ok).toBe(false);
  });

  it("rejects .svg", () => {
    expect(validateFileExtension("file.svg", DOCUMENT_ALLOWED_EXTENSIONS).ok).toBe(false);
  });
});

describe("sanitizeFileName", () => {
  it("replaces special characters", () => {
    expect(sanitizeFileName("my file (1).pdf")).toBe("my_file__1_.pdf");
  });

  it("preserves alphanumeric, dots, hyphens, underscores", () => {
    expect(sanitizeFileName("my-file_v2.pdf")).toBe("my-file_v2.pdf");
  });

  it("collapses multiple underscores", () => {
    expect(sanitizeFileName("a  b")).toBe("a_b");
  });

  it("truncates long filenames", () => {
    const longName = "a".repeat(300) + ".pdf";
    expect(sanitizeFileName(longName).length).toBeLessThanOrEqual(200);
  });
});

describe("validateExternalUrl", () => {
  it("allows valid https URL", () => {
    expect(validateExternalUrl("https://example.com/file.pdf").ok).toBe(true);
  });

  it("allows valid http URL", () => {
    expect(validateExternalUrl("http://example.com/file.pdf").ok).toBe(true);
  });

  it("rejects localhost", () => {
    expect(validateExternalUrl("http://localhost/secret").ok).toBe(false);
  });

  it("rejects 127.0.0.1", () => {
    expect(validateExternalUrl("http://127.0.0.1/secret").ok).toBe(false);
  });

  it("rejects 10.x internal IP", () => {
    expect(validateExternalUrl("http://10.0.0.1/secret").ok).toBe(false);
  });

  it("rejects 192.168.x internal IP", () => {
    expect(validateExternalUrl("http://192.168.1.100/secret").ok).toBe(false);
  });

  it("rejects non-http protocol", () => {
    expect(validateExternalUrl("ftp://example.com/file").ok).toBe(false);
  });

  it("rejects invalid URL", () => {
    expect(validateExternalUrl("not-a-url").ok).toBe(false);
  });
});
