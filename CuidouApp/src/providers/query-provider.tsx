import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";

import { ApiClientError } from "@/src/lib/api/client";

/** Do not retry on 4xx client errors — only on network failures and 5xx. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiClientError) {
    // Never retry on auth/permission/validation errors
    if (error.status >= 400 && error.status < 500) {
      return false;
    }
  }
  // Abort signals (timeout) — no retry
  if (error instanceof Error && error.name === "AbortError") {
    return false;
  }
  return failureCount < 2;
}

export function AppQueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: shouldRetry,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
