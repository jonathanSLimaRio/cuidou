import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ $queryRaw: vi.fn() }));
const wordpressMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/wordpress-media", () => ({ isWordPressConfigured: wordpressMock }));

import { getLiveness, getReadiness } from "../health";

describe("health checks", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    prismaMock.$queryRaw.mockResolvedValue([{ one: 1 }]);
    wordpressMock.mockReturnValue(true);
  });

  it("keeps liveness independent and reports a ready development process", async () => {
    expect(getLiveness()).toMatchObject({ status: "ok" });
    expect(await getReadiness()).toMatchObject({ status: "ok", db: "ok" });
  });

  it("degrades readiness when the database is unavailable", async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error("offline"));
    expect(await getReadiness()).toMatchObject({ status: "degraded", db: "error", dbLatencyMs: null });
  });

  it("requires operational integrations in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ABLY_API_KEY", "");
    wordpressMock.mockReturnValue(false);
    const result = await getReadiness();
    expect(result.status).toBe("degraded");
    expect(result.missingIntegrations).toEqual(expect.arrayContaining(["ably", "wordpress", "email", "redis"]));
  });
});
