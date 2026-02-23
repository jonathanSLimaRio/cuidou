import { auth, signOut } from "@/auth";
import { AppIcon } from "@/components/theme/app-icon";
import { CtaButton } from "@/components/theme/cta-button";
import { DrawerNav } from "@/components/theme/drawer-nav";
import {
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
        <div className="theme-container flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2 text-xs">
          <p className="font-display tracking-[0.04em] text-white/92">
            Cuidou: contratação segura de babás e cuidadoras, sem intermediação de pagamento.
          </p>
          <a
            href="tel:+550800123456"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-white/95 hover:bg-white/10"
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
            className="inline-flex items-center gap-2 text-xl font-display text-[var(--theme-navy)]"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--theme-pink)] text-sm text-[var(--theme-indigo-strong)]">
              C
            </span>
            Cuidou
          </Link>

          <nav className="hidden items-center gap-1 text-sm md:flex">
            <Link
              href="/marketplace/jobs"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-[var(--theme-body)] hover:bg-[var(--theme-cream)] hover:text-[var(--theme-navy)]"
            >
              <AppIcon icon={BriefcaseBusiness} size="sm" />
              Vagas
            </Link>
            <Link
              href="/marketplace/professionals"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-[var(--theme-body)] hover:bg-[var(--theme-cream)] hover:text-[var(--theme-navy)]"
            >
              <AppIcon icon={Users} size="sm" />
              Profissionais
            </Link>

            {hasSession ? (
              <>
                <Link
                  href={homePath}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-[var(--theme-body)] hover:bg-[var(--theme-cream)] hover:text-[var(--theme-navy)]"
                >
                  <AppIcon icon={LayoutDashboard} size="sm" />
                  Dashboard
                </Link>
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-[var(--theme-body)] hover:bg-[var(--theme-cream)] hover:text-[var(--theme-navy)]"
                >
                  <AppIcon icon={MessageCircleMore} size="sm" />
                  Chat
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
              className="inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 font-display text-[var(--theme-body)] hover:bg-[var(--theme-cream)] hover:text-[var(--theme-navy)]"
            >
              <AppIcon icon={BriefcaseBusiness} size="sm" />
              Vagas
            </Link>
            <Link
              href="/marketplace/professionals"
              className="inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 font-display text-[var(--theme-body)] hover:bg-[var(--theme-cream)] hover:text-[var(--theme-navy)]"
            >
              <AppIcon icon={Users} size="sm" />
              Profissionais
            </Link>

            {hasSession ? (
              <>
                <Link
                  href={homePath}
                  className="inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 font-display text-[var(--theme-body)] hover:bg-[var(--theme-cream)] hover:text-[var(--theme-navy)]"
                >
                  <AppIcon icon={LayoutDashboard} size="sm" />
                  Dashboard
                </Link>
                <Link
                  href="/chat"
                  className="inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 font-display text-[var(--theme-body)] hover:bg-[var(--theme-cream)] hover:text-[var(--theme-navy)]"
                >
                  <AppIcon icon={MessageCircleMore} size="sm" />
                  Chat
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
