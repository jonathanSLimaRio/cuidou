export type RetryOptions = {
  maxRetries?: number;
  backoffMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxRetries = 2, backoffMs = 1_000, shouldRetry = () => true } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries || !shouldRetry(error, attempt)) {
        throw error;
      }
      await sleep(backoffMs * Math.pow(2, attempt));
    }
  }

  throw lastError;
}
