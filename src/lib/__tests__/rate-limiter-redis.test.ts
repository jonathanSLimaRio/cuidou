import { afterEach, describe, expect, it, vi } from "vitest";

const upstash = vi.hoisted(() => {
  const limit = vi.fn();
  const Redis = vi.fn(function Redis() {});
  const slidingWindow = vi.fn(() => "window");
  const Ratelimit = Object.assign(
    vi.fn(function Ratelimit() {
      return { limit };
    }),
    { slidingWindow },
  );
  return { limit, Redis, Ratelimit, slidingWindow };
});

vi.mock("@upstash/redis", () => ({ Redis: upstash.Redis }));
vi.mock("@upstash/ratelimit", () => ({ Ratelimit: upstash.Ratelimit }));

describe("distributed rate limiting", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("fails closed in production when Redis configuration is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { checkRateLimit } = await import("../rate-limiter");

    await expect(
      checkRateLimit("login:user", { max: 3, windowMs: 60_000 }),
    ).rejects.toThrow("required in production");
  });

  it("reuses a Redis limiter and maps the provider response", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    upstash.limit.mockResolvedValue({ success: true, remaining: 2, reset: 42 });
    const { checkRateLimit } = await import("../rate-limiter");
    const options = { max: 3, windowMs: 1_500 };

    await expect(checkRateLimit("login:user-1", options)).resolves.toEqual({
      allowed: true,
      remaining: 2,
      resetAt: 42,
    });
    await checkRateLimit("login:user-2", options);

    expect(upstash.Redis).toHaveBeenCalledOnce();
    expect(upstash.Ratelimit).toHaveBeenCalledOnce();
    expect(upstash.slidingWindow).toHaveBeenCalledWith(3, "2 s");
    expect(upstash.limit).toHaveBeenNthCalledWith(1, "user-1");
    expect(upstash.limit).toHaveBeenNthCalledWith(2, "user-2");
  });
});
