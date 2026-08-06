import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  mobileRefreshToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  authenticateMobilePassword,
  createMobileSession,
  getMobileUserFromBearer,
  hashMobileRefreshToken,
  mobileAuthErrorResponse,
  MobileAuthError,
  requireMobileUser,
  revokeMobileRefreshToken,
  rotateMobileSession,
  signMobileAccessToken,
  toMobileUser,
  verifyMobileAccessToken,
} from "@/lib/mobile-auth";
import { hash } from "bcryptjs";

describe("mobile authentication tokens", () => {
  const user = {
    id: "cmobile-user-1",
    email: "familia@example.com",
    name: "Família Teste",
    role: "FAMILY" as const,
    status: "ACTIVE" as const,
    needsLegalConsent: false,
    acceptedTermsAt: new Date(),
    acceptedPrivacyAt: new Date(),
    acceptedTermsVersion: "2026-08-06",
    acceptedPrivacyVersion: "2026-08-06",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));
    prismaMock.mobileRefreshToken.create.mockResolvedValue({});
    prismaMock.mobileRefreshToken.updateMany.mockResolvedValue({ count: 1 });
  });

  it("signs and verifies a short-lived access token by subject", async () => {
    const token = await signMobileAccessToken(user);

    await expect(verifyMobileAccessToken(token)).resolves.toEqual({
      userId: user.id,
    });
  });

  it("rejects malformed and foreign tokens", async () => {
    await expect(verifyMobileAccessToken("not-a-jwt")).resolves.toBeNull();

    const token = await signMobileAccessToken(user);
    const [header, payload, signature] = token.split(".");
    const tamperedSignature = `${signature[0] === "a" ? "b" : "a"}${signature.slice(1)}`;
    const tampered = `${header}.${payload}.${tamperedSignature}`;
    await expect(verifyMobileAccessToken(tampered)).resolves.toBeNull();
  });

  it("hashes refresh tokens deterministically without exposing the token", () => {
    const token = "refresh-token-value-that-is-never-stored-raw";
    const hash = hashMobileRefreshToken(token);

    expect(hash).toHaveLength(64);
    expect(hash).toBe(hashMobileRefreshToken(token));
    expect(hash).not.toContain(token);
  });

  it("enforces the current role from the database for bearer access", async () => {
    prismaMock.user.findUnique.mockResolvedValue(user);
    const token = await signMobileAccessToken(user);
    const request = new Request("http://localhost/api/family/profile", {
      headers: { authorization: `Bearer ${token}` },
    });

    await expect(requireMobileUser(request, ["FAMILY"])).resolves.toMatchObject({
      id: user.id,
      role: "FAMILY",
    });

    await expect(requireMobileUser(request, ["PROFESSIONAL"])).rejects.toMatchObject({
      status: 403,
      code: "forbidden",
    });
  });

  it("handles absent, empty, invalid and unknown bearer credentials", async () => {
    await expect(getMobileUserFromBearer(new Request("http://localhost/api"))).resolves.toBeNull();
    await expect(getMobileUserFromBearer(new Request("http://localhost/api", { headers: { authorization: "Bearer " } }))).resolves.toBeNull();
    await expect(getMobileUserFromBearer(new Request("http://localhost/api", { headers: { authorization: "Bearer invalid" } }))).resolves.toBeNull();
    const token = await signMobileAccessToken(user);
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(getMobileUserFromBearer(new Request("http://localhost/api", { headers: { authorization: `Bearer ${token}` } }))).resolves.toBeNull();
  });

  it("rejects missing and inactive users before role authorization", async () => {
    await expect(requireMobileUser(new Request("http://localhost/api"))).rejects.toMatchObject({ status: 401, code: "unauthorized" });
    const token = await signMobileAccessToken(user);
    prismaMock.user.findUnique.mockResolvedValue({ ...user, status: "SUSPENDED" });
    const request = new Request("http://localhost/api", { headers: { authorization: `Bearer ${token}` } });
    await expect(requireMobileUser(request)).rejects.toMatchObject({ status: 403, code: "account_inactive" });
  });

  it("normalizes public session users and auth errors", async () => {
    expect(toMobileUser({ ...user, email: null })).toMatchObject({ email: "", needsLegalConsent: false });
    const known = mobileAuthErrorResponse(new MobileAuthError(409, "known", "Known"));
    expect(known.status).toBe(409);
    await expect(known.json()).resolves.toMatchObject({ code: "known" });
    const unknown = mobileAuthErrorResponse(new Error("secret provider failure"));
    expect(unknown.status).toBe(500);
    await expect(unknown.json()).resolves.toMatchObject({ code: "auth_unavailable" });
  });

  it("authenticates active passwords and categorizes account states", async () => {
    const passwordHash = await hash("Senha123", 4);
    prismaMock.user.findUnique.mockResolvedValue({ ...user, passwordHash });
    await expect(authenticateMobilePassword(" FAMILIA@example.com ", "Senha123")).resolves.toMatchObject({ id: user.id, needsLegalConsent: false });
    await expect(authenticateMobilePassword(user.email, "errada")).rejects.toMatchObject({ code: "credentials_invalid" });

    for (const [status, code] of [["PENDING", "pending_approval"], ["SUSPENDED", "account_suspended"], ["BANNED", "account_banned"]] as const) {
      prismaMock.user.findUnique.mockResolvedValue({ ...user, passwordHash, status });
      await expect(authenticateMobilePassword(user.email, "Senha123")).rejects.toMatchObject({ code });
    }
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(authenticateMobilePassword(user.email, "Senha123")).rejects.toMatchObject({ code: "credentials_invalid" });
  });

  it("creates, rotates and revokes refresh sessions", async () => {
    const created = await createMobileSession(user);
    expect(created.accessToken).toEqual(expect.any(String));
    expect(created.refreshToken).toEqual(expect.any(String));
    expect(prismaMock.mobileRefreshToken.create).toHaveBeenCalledOnce();

    const stored = { id: "refresh-1", userId: user.id, revokedAt: null, expiresAt: new Date(Date.now() + 60_000) };
    prismaMock.mobileRefreshToken.findUnique.mockResolvedValue(stored);
    prismaMock.user.findUnique.mockResolvedValue(user);
    const rotated = await rotateMobileSession("old-refresh-token");
    expect(rotated.refreshToken).not.toBe("old-refresh-token");
    expect(prismaMock.mobileRefreshToken.updateMany).toHaveBeenCalled();

    await revokeMobileRefreshToken(null);
    await revokeMobileRefreshToken(rotated.refreshToken);
    expect(prismaMock.mobileRefreshToken.updateMany).toHaveBeenCalled();
  });

  it("rejects invalid, inactive and reused refresh tokens", async () => {
    prismaMock.mobileRefreshToken.findUnique.mockResolvedValue(null);
    await expect(rotateMobileSession("missing")).rejects.toMatchObject({ code: "refresh_token_invalid" });

    prismaMock.mobileRefreshToken.findUnique.mockResolvedValue({ id: "r1", userId: user.id, revokedAt: null, expiresAt: new Date(Date.now() + 60_000) });
    prismaMock.user.findUnique.mockResolvedValue({ ...user, status: "SUSPENDED" });
    await expect(rotateMobileSession("inactive")).rejects.toMatchObject({ code: "account_inactive" });

    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.mobileRefreshToken.updateMany.mockResolvedValue({ count: 0 });
    await expect(rotateMobileSession("reused")).rejects.toMatchObject({ code: "refresh_token_reused" });
  });
});
