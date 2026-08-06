import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => ({ auth: vi.fn() }));
const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
}));
const jwtMock = vi.hoisted(() => ({ getToken: vi.fn() }));

vi.mock("@/auth", () => authMock);
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next-auth/jwt", () => jwtMock);

import { isAdmin, requireUser } from "@/lib/auth-guard";
import { signMobileAccessToken } from "@/lib/mobile-auth";
import { UserRole } from "@prisma/client";

describe("requireUser bearer integration", () => {
  const user = {
    id: "mobile-family-1",
    email: "family@example.com",
    name: "Family",
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
    authMock.auth.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(user);
    jwtMock.getToken.mockResolvedValue(null);
  });

  it("rejects requests without any authenticated identity", async () => {
    await expect(requireUser()).resolves.toMatchObject({
      response: expect.objectContaining({ status: 401 }),
    });
  });

  it("accepts an active browser session with the required role", async () => {
    authMock.auth.mockResolvedValue({ user });

    await expect(requireUser([UserRole.FAMILY])).resolves.toMatchObject({
      user: { id: user.id, role: UserRole.FAMILY },
    });
  });

  it("rejects inactive browser sessions", async () => {
    authMock.auth.mockResolvedValue({
      user: { ...user, status: "SUSPENDED" },
    });

    await expect(requireUser()).resolves.toMatchObject({
      response: expect.objectContaining({ status: 403 }),
    });
  });

  it("requires current consent except on the two consent bootstrap endpoints", async () => {
    authMock.auth.mockResolvedValue({
      user: { ...user, needsLegalConsent: true },
    });

    await expect(
      requireUser(undefined, new Request("http://localhost/api/conversations")),
    ).resolves.toMatchObject({ response: expect.objectContaining({ status: 403 }) });

    await expect(
      requireUser(undefined, new Request("http://localhost/api/legal/consent")),
    ).resolves.toMatchObject({ user: { id: user.id } });

    await expect(
      requireUser(undefined, new Request("http://localhost/api/onboarding/role")),
    ).resolves.toMatchObject({ user: { id: user.id } });
  });

  it("rejects an active browser user with an insufficient role", async () => {
    authMock.auth.mockResolvedValue({ user });

    await expect(requireUser([UserRole.ADMIN])).resolves.toMatchObject({
      response: expect.objectContaining({ status: 403 }),
    });
  });

  it("accepts a valid mobile bearer token when the request is forwarded", async () => {
    const token = await signMobileAccessToken(user);
    const request = new Request("http://localhost/api/conversations", {
      headers: { authorization: `Bearer ${token}` },
    });

    await expect(requireUser([UserRole.FAMILY], request)).resolves.toMatchObject({
      user: { id: user.id, role: user.role },
    });
  });

  it("rejects a bearer token when the current database role does not match", async () => {
    const token = await signMobileAccessToken(user);
    const request = new Request("http://localhost/api/conversations", {
      headers: { authorization: `Bearer ${token}` },
    });

    await expect(requireUser([UserRole.PROFESSIONAL], request)).resolves.toMatchObject({
      response: expect.objectContaining({ status: 403 }),
    });
  });

  it("does not fall back to a browser cookie when a bearer token is invalid", async () => {
    authMock.auth.mockResolvedValue({
      user: { ...user, id: "cookie-admin", role: UserRole.ADMIN },
    });
    const request = new Request("http://localhost/api/admin/metrics", {
      headers: { authorization: "Bearer invalid-token" },
    });

    await expect(requireUser([UserRole.ADMIN], request)).resolves.toMatchObject({
      response: expect.objectContaining({ status: 401 }),
    });
  });

  it("supports legacy Auth.js bearer tokens by reloading the current database user", async () => {
    jwtMock.getToken.mockResolvedValue({ id: user.id });
    const request = new Request("http://localhost/api/conversations", {
      headers: { authorization: "Bearer legacy-authjs-token" },
    });

    await expect(requireUser([UserRole.FAMILY], request)).resolves.toMatchObject({
      user: { id: user.id, needsLegalConsent: false },
    });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: user.id } }),
    );
  });

  it("fails closed when a legacy bearer token cannot be decoded or has no user", async () => {
    const request = new Request("http://localhost/api/conversations", {
      headers: { authorization: "Bearer legacy-authjs-token" },
    });

    jwtMock.getToken.mockRejectedValueOnce(new Error("decode failed"));
    await expect(requireUser(undefined, request)).resolves.toMatchObject({
      response: expect.objectContaining({ status: 401 }),
    });

    jwtMock.getToken.mockResolvedValueOnce({ sub: "deleted-user" });
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    await expect(requireUser(undefined, request)).resolves.toMatchObject({
      response: expect.objectContaining({ status: 401 }),
    });
  });

  it("identifies administrators without granting admin to other roles", () => {
    expect(isAdmin({ ...user, role: UserRole.ADMIN })).toBe(true);
    expect(isAdmin(user)).toBe(false);
  });
});
