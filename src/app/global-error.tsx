"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main className="theme-page">
          <section className="theme-card mx-auto max-w-xl p-8 text-center" role="alert">
            <h1 className="text-3xl">Não foi possível carregar esta página</h1>
            <p className="mt-3 text-[var(--theme-body)]">
              O erro foi registrado. Tente novamente; se continuar, volte mais tarde.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 min-h-11 rounded-full bg-[var(--theme-indigo)] px-6 py-2.5 font-display text-white"
            >
              Tentar novamente
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
