import { describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  hashMobileRefreshToken,
  requireMobileUser,
  signMobileAccessToken,
  verifyMobileAccessToken,
} from "@/lib/mobile-auth";

describe("mobile authentication tokens", () => {
  const user = {
    id: "cmobile-user-1",
    email: "familia@example.com",
    name: "Família Teste",
    role: "FAMILY" as const,
    status: "ACTIVE" as const,
  };

  it("signs and verifies a short-lived access token by subject", async () => {
    const token = await signMobileAccessToken(user);

    await expect(verifyMobileAccessToken(token)).resolves.toEqual({
      userId: user.id,
    });
  });

  it("rejects malformed and foreign tokens", async () => {
    await expect(verifyMobileAccessToken("not-a-jwt")).resolves.toBeNull();

    const token = await signMobileAccessToken(user);
    const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
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
});
