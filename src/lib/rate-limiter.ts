import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type WindowEntry = {
  timestamps: number[];
};

const memoryStore = new Map<string, WindowEntry>();
const limiters = new Map<string, Ratelimit>();

let redis: Redis | null = null;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

function getRedis() {
  if (redis) {
    return redis;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production.",
      );
    }

    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

function limiterDuration(windowMs: number) {
  return `${Math.ceil(windowMs / 1000)} s` as `${number} s`;
}

function getLimiter(prefix: string, options: { max: number; windowMs: number }) {
  const redisClient = getRedis();
  if (!redisClient) {
    return null;
  }

  const cacheKey = `${prefix}:${options.max}:${options.windowMs}`;
  const existing = limiters.get(cacheKey);
  if (existing) {
    return existing;
  }

  const limiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(options.max, limiterDuration(options.windowMs)),
    prefix: `cuidou:${prefix}`,
    analytics: false,
  });
  limiters.set(cacheKey, limiter);
  return limiter;
}

function prune(entry: WindowEntry, windowMs: number, now: number) {
  const cutoff = now - windowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
}

function checkMemoryRateLimit(
  key: string,
  options: { max: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const { max, windowMs } = options;

  let entry = memoryStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    memoryStore.set(key, entry);
  }

  prune(entry, windowMs, now);

  const allowed = entry.timestamps.length < max;
  if (allowed) {
    entry.timestamps.push(now);
  }

  const oldest = entry.timestamps[0];
  const resetAt = oldest ? oldest + windowMs : now + windowMs;
  const remaining = Math.max(0, max - entry.timestamps.length);

  return { allowed, remaining, resetAt };
}

export async function checkRateLimit(
  key: string,
  options: { max: number; windowMs: number },
): Promise<RateLimitResult> {
  const prefixSeparator = key.indexOf(":");
  const prefix = prefixSeparator === -1 ? "default" : key.slice(0, prefixSeparator);
  const identifier = prefixSeparator === -1 ? key : key.slice(prefixSeparator + 1);
  const limiter = getLimiter(prefix, options);

  if (!limiter) {
    return checkMemoryRateLimit(key, options);
  }

  const result = await limiter.limit(identifier);
  return {
    allowed: result.success,
    remaining: result.remaining,
    resetAt: result.reset,
  };
}

export function rateLimitHeaders(result: RateLimitResult, max: number): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(max),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

export function rateLimitKey(prefix: string, request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]!.trim() : "unknown";
  return `${prefix}:${ip}`;
}
