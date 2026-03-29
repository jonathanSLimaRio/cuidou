import { auth, signOut } from "@/auth";
import { CuidouMark } from "@/components/brand/cuidou-mark";
import { AppIcon } from "@/components/theme/app-icon";
import { CtaButton } from "@/components/theme/cta-button";
import { DrawerNav } from "@/components/theme/drawer-nav";
import {
  Bell,
  BriefcaseBusiness,
  LayoutDashboard,
  LogIn,
  LogOut,
  MessageCircleMore,
  Phone,
  Users,
} from "lucide-react";
import Link from "next/link";

function roleHome(role?: string | null) {
  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "FAMILY") {
    return "/family";
  }

  if (role === "PROFESSIONAL") {
    return "/professional";
  }

  return "/dashboard";
}

export async function SiteHeader() {
  const session = await auth();
  const hasSession = Boolean(session?.user);
  const homePath = roleHome(session?.user?.role);

  return (
    <header className="sticky top-0 z-40">
      <div className="border-b border-white/10 bg-[var(--theme-indigo-strong)] text-white">
        <div className="theme-container flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2 text-[13px]">
          <p className="font-display font-medium tracking-[0.025em] text-white">
            Cuidou: contratação segura de babás e cuidadoras, sem intermediação de pagamento.
          </p>
          <a
            href="tel:+550800123456"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1 text-white hover:bg-white/10"
          >
            <AppIcon icon={Phone} size="sm" />
            Suporte: 0800 123-456
          </a>
        </div>
      </div>

      <div className="border-b border-[var(--theme-border)] bg-white/92 backdrop-blur-md">
        <div className="theme-container flex min-h-[4.4rem] items-center justify-between gap-3 py-3">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center rounded-xl px-1 py-1 text-[var(--brand-purple-primary)]"
          >
            <span className="sm:hidden">
              <CuidouMark size="mobile" priority />
            </span>
            <span className="hidden sm:inline-flex">
              <CuidouMark size="desktop" priority />
            </span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm md:flex">
            <Link
              href="/marketplace/jobs"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-[var(--brand-purple-primary)] hover:bg-[var(--theme-cream)] hover:text-[var(--brand-purple-secondary)]"
            >
              <AppIcon icon={BriefcaseBusiness} size="sm" />
              Vagas
            </Link>
            <Link
              href="/marketplace/professionals"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-[var(--brand-purple-primary)] hover:bg-[var(--theme-cream)] hover:text-[var(--brand-purple-secondary)]"
            >
              <AppIcon icon={Users} size="sm" />
              Profissionais
            </Link>

            {hasSession ? (
              <>
                <Link
                  href={homePath}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-[var(--brand-purple-primary)] hover:bg-[var(--theme-cream)] hover:text-[var(--brand-purple-secondary)]"
                >
                  <AppIcon icon={LayoutDashboard} size="sm" />
                  Dashboard
                </Link>
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-[var(--brand-purple-primary)] hover:bg-[var(--theme-cream)] hover:text-[var(--brand-purple-secondary)]"
                >
                  <AppIcon icon={MessageCircleMore} size="sm" />
                  Chat
                </Link>
                <Link
                  href="/notifications"
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-[var(--brand-purple-primary)] hover:bg-[var(--theme-cream)] hover:text-[var(--brand-purple-secondary)]"
                >
                  <AppIcon icon={Bell} size="sm" />
                  Notificacoes
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <CtaButton type="submit" variant="outline" size="sm" icon={LogOut}>
                    Sair
                  </CtaButton>
                </form>
              </>
            ) : (
              <CtaButton href="/login" variant="primary" size="sm" icon={LogIn}>
                Entrar
              </CtaButton>
            )}
          </nav>

          <DrawerNav title="Navegação">
            <Link
              href="/marketplace/jobs"
              className="inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 font-display text-[var(--brand-purple-primary)] hover:bg-[var(--theme-cream)] hover:text-[var(--brand-purple-secondary)]"
            >
              <AppIcon icon={BriefcaseBusiness} size="sm" />
              Vagas
            </Link>
            <Link
              href="/marketplace/professionals"
              className="inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 font-display text-[var(--brand-purple-primary)] hover:bg-[var(--theme-cream)] hover:text-[var(--brand-purple-secondary)]"
            >
              <AppIcon icon={Users} size="sm" />
              Profissionais
            </Link>

            {hasSession ? (
              <>
                <Link
                  href={homePath}
                  className="inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 font-display text-[var(--brand-purple-primary)] hover:bg-[var(--theme-cream)] hover:text-[var(--brand-purple-secondary)]"
                >
                  <AppIcon icon={LayoutDashboard} size="sm" />
                  Dashboard
                </Link>
                <Link
                  href="/chat"
                  className="inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 font-display text-[var(--brand-purple-primary)] hover:bg-[var(--theme-cream)] hover:text-[var(--brand-purple-secondary)]"
                >
                  <AppIcon icon={MessageCircleMore} size="sm" />
                  Chat
                </Link>
                <Link
                  href="/notifications"
                  className="inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 font-display text-[var(--brand-purple-primary)] hover:bg-[var(--theme-cream)] hover:text-[var(--brand-purple-secondary)]"
                >
                  <AppIcon icon={Bell} size="sm" />
                  Notificacoes
                </Link>
                <form
                  className="pt-1"
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <CtaButton type="submit" variant="outline" className="w-full" icon={LogOut}>
                    Sair
                  </CtaButton>
                </form>
              </>
            ) : (
              <CtaButton href="/login" variant="primary" className="w-full" icon={LogIn}>
                Entrar
              </CtaButton>
            )}
          </DrawerNav>
        </div>
      </div>
    </header>
  );
}
