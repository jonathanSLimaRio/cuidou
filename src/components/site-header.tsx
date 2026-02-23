import { auth, signIn, signOut } from "@/auth";
import { CtaButton } from "@/components/theme/cta-button";
import Link from "next/link";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40">
      <div className="border-b border-white/10 bg-[var(--theme-indigo-strong)] text-white">
        <div className="theme-container flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2 text-xs">
          <p className="font-display tracking-[0.04em] text-white/90">
            Cuidou: contratação segura de babás e cuidadoras, sem intermediação de pagamento.
          </p>
          <a
            href="tel:+550800123456"
            className="rounded-full border border-white/20 px-3 py-1 text-white/95 hover:bg-white/10"
          >
            Suporte: 0800 123-456
          </a>
        </div>
      </div>

      <div className="border-b border-[var(--theme-border)] bg-white/92 backdrop-blur-md">
        <div className="theme-container flex min-h-[4.3rem] flex-wrap items-center justify-between gap-3 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xl font-display text-[var(--theme-navy)]"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--theme-pink)] text-sm">
              C
            </span>
            Cuidou
          </Link>

          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/marketplace/jobs"
              className="rounded-full px-3 py-2 font-display text-[var(--theme-body)] hover:bg-[var(--theme-cream)] hover:text-[var(--theme-navy)]"
            >
              Vagas
            </Link>
            <Link
              href="/marketplace/professionals"
              className="rounded-full px-3 py-2 font-display text-[var(--theme-body)] hover:bg-[var(--theme-cream)] hover:text-[var(--theme-navy)]"
            >
              Profissionais
            </Link>

            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-full px-3 py-2 font-display text-[var(--theme-body)] hover:bg-[var(--theme-cream)] hover:text-[var(--theme-navy)]"
                >
                  Dashboard
                </Link>
                <Link
                  href="/chat"
                  className="rounded-full px-3 py-2 font-display text-[var(--theme-body)] hover:bg-[var(--theme-cream)] hover:text-[var(--theme-navy)]"
                >
                  Chat
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <CtaButton type="submit" variant="outline" size="sm">
                    Sair
                  </CtaButton>
                </form>
              </>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/dashboard" });
                }}
              >
                <CtaButton type="submit" variant="primary" size="sm">
                  Entrar com Google
                </CtaButton>
              </form>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
