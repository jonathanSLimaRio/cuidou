import { describe, expect, it, vi, beforeEach } from "vitest";
import { checkRateLimit, rateLimitKey } from "../rate-limiter";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    const key = `test-allow-${Date.now()}`;
    const opts = { max: 3, windowMs: 60_000 };

    expect(checkRateLimit(key, opts).allowed).toBe(true);
    expect(checkRateLimit(key, opts).allowed).toBe(true);
    expect(checkRateLimit(key, opts).allowed).toBe(true);
  });

  it("blocks after reaching the limit", () => {
    const key = `test-block-${Date.now()}`;
    const opts = { max: 2, windowMs: 60_000 };

    checkRateLimit(key, opts);
    checkRateLimit(key, opts);
    const third = checkRateLimit(key, opts);

    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("reports correct remaining count", () => {
    const key = `test-remaining-${Date.now()}`;
    const opts = { max: 5, windowMs: 60_000 };

    checkRateLimit(key, opts);
    const result = checkRateLimit(key, opts);
    expect(result.remaining).toBe(3);
  });

  it("allows again after window expires", () => {
    const key = `test-window-${Date.now()}`;
    const opts = { max: 1, windowMs: 1_000 };

    checkRateLimit(key, opts);
    expect(checkRateLimit(key, opts).allowed).toBe(false);

    // Advance time past window
    vi.advanceTimersByTime(1_100);

    expect(checkRateLimit(key, opts).allowed).toBe(true);
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
});
