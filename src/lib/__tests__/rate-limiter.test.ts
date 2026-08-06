import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, rateLimitHeaders, rateLimitKey } from "../rate-limiter";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", async () => {
    const key = `test-allow-${Date.now()}`;
    const opts = { max: 3, windowMs: 60_000 };

    await expect(checkRateLimit(key, opts)).resolves.toMatchObject({ allowed: true });
    await expect(checkRateLimit(key, opts)).resolves.toMatchObject({ allowed: true });
    await expect(checkRateLimit(key, opts)).resolves.toMatchObject({ allowed: true });
  });

  it("blocks after reaching the limit", async () => {
    const key = `test-block-${Date.now()}`;
    const opts = { max: 2, windowMs: 60_000 };

    await checkRateLimit(key, opts);
    await checkRateLimit(key, opts);
    const third = await checkRateLimit(key, opts);

    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("reports correct remaining count", async () => {
    const key = `test-remaining-${Date.now()}`;
    const opts = { max: 5, windowMs: 60_000 };

    await checkRateLimit(key, opts);
    const result = await checkRateLimit(key, opts);
    expect(result.remaining).toBe(3);
  });

  it("allows again after window expires", async () => {
    const key = `test-window-${Date.now()}`;
    const opts = { max: 1, windowMs: 1_000 };

    await checkRateLimit(key, opts);
    await expect(checkRateLimit(key, opts)).resolves.toMatchObject({ allowed: false });

    // Advance time past window
    vi.advanceTimersByTime(1_100);

    await expect(checkRateLimit(key, opts)).resolves.toMatchObject({ allowed: true });
  });
});

describe("rateLimitKey", () => {
  it("includes the prefix", () => {
    const request = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    const key = rateLimitKey("signup", request);
    expect(key).toContain("signup");
  });

  it("includes the IP", () => {
    const request = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    const key = rateLimitKey("signup", request);
    expect(key).toContain("1.2.3.4");
  });

  it("falls back to unknown when no IP header", () => {
    const request = new Request("http://localhost/api/test");
    const key = rateLimitKey("signup", request);
    expect(key).toContain("unknown");
  });

  it("uses only the first address from a forwarded proxy chain", () => {
    const request = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" },
    });

    expect(rateLimitKey("signup", request)).toBe("signup:1.2.3.4");
  });
});

describe("rateLimitHeaders", () => {
  it("serializes limit metadata and rounds reset time to seconds", () => {
    expect(
      rateLimitHeaders({ allowed: true, remaining: 2, resetAt: 1_501 }, 3),
    ).toEqual({
      "X-RateLimit-Limit": "3",
      "X-RateLimit-Remaining": "2",
      "X-RateLimit-Reset": "2",
    });
  });
});
