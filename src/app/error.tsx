"use client";

import { useEffect } from "react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to structured logger on the client side
    console.error("[route-error]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-4">
        <p className="text-sm font-medium uppercase tracking-widest text-[var(--theme-muted)]">
          Erro
        </p>
        <h1 className="text-3xl font-bold text-[var(--theme-navy)]">
          Algo deu errado
        </h1>
        <p className="text-[var(--theme-body)]">
          Ocorreu um erro inesperado nesta página. Por favor, tente novamente.
        </p>
        {process.env.NODE_ENV === "development" && error.message ? (
          <pre className="mt-2 overflow-auto rounded-xl bg-red-50 p-3 text-left text-xs text-red-700">
            {error.message}
          </pre>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-4 inline-flex items-center rounded-full bg-[var(--brand-purple-primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-purple-secondary)]"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
