/**
 * In-memory sliding window rate limiter.
 * Suitable for single-instance deployments (Vercel serverless, Railway).
 * For multi-instance deployments, replace with Upstash Redis.
 */

type WindowEntry = {
  timestamps: number[];
};

const store = new Map<string, WindowEntry>();

// Prune entries older than the window to prevent unbounded memory growth
function prune(entry: WindowEntry, windowMs: number, now: number) {
  const cutoff = now - windowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number; // unix ms when the oldest request falls out of the window
};

export function checkRateLimit(
  key: string,
  options: { max: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const { max, windowMs } = options;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
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

export function rateLimitHeaders(result: RateLimitResult, max: number): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(max),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

export function rateLimitKey(prefix: string, request: Request): string {
  // Use IP from forwarded header or fallback
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]!.trim() : "unknown";
  return `${prefix}:${ip}`;
}
