import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => ({ auth: vi.fn() }));
const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
}));

vi.mock("@/auth", () => authMock);
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next-auth/jwt", () => ({ getToken: vi.fn() }));

import { requireUser } from "@/lib/auth-guard";
import { signMobileAccessToken } from "@/lib/mobile-auth";
import { UserRole } from "@prisma/client";

describe("requireUser bearer integration", () => {
  const user = {
    id: "mobile-family-1",
    email: "family@example.com",
    name: "Family",
    role: "FAMILY" as const,
    status: "ACTIVE" as const,
  };

  beforeEach(() => {
    authMock.auth.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(user);
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
});
