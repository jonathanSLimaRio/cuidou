import { auth, signIn } from "@/auth";
import { CredentialsLoginForm } from "@/components/auth/credentials-login-form";
import { AppIcon } from "@/components/theme/app-icon";
import { BlobDecor } from "@/components/theme/blob-decor";
import { CtaButton } from "@/components/theme/cta-button";
import { resolveDesignImage } from "@/lib/design-media";
import { getWordPressMediaGallery } from "@/lib/wordpress-content";
import { BadgeCheck, Baby, HeartHandshake, LockKeyhole, LogIn, Users } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  next?: string;
  error?: string;
  code?: string;
}>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = resolvedSearchParams.next || "/dashboard";

  const session = await auth();

  if (session?.user) {
    // Admin must use /admin, not /dashboard
    if (session.user.role === "ADMIN") {
      redirect("/admin");
    }
    redirect("/dashboard");
  }

  const gallery = await getWordPressMediaGallery(20);
  const heroImage = resolveDesignImage("loginHero", gallery, 2, "Família e profissional de cuidado");

  return (
    <main className="theme-page">
      <div className="theme-container">
        <div className="theme-auth-shell">
          <aside className="theme-auth-side p-7 sm:p-8 lg:p-10">
            <BlobDecor tone="pink" className="-right-8 top-5 h-28 w-28 opacity-75" />
            <BlobDecor tone="yellow" className="-left-6 bottom-6 h-24 w-24 opacity-75" />

            <div className="relative flex w-full flex-col gap-5">
              <p className="theme-chip theme-chip-pink w-fit">Acesso seguro</p>

              <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/12 p-2">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-white/20">
                  {heroImage ? (
                    <Image
                      src={heroImage.src}
                      alt={heroImage.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>
              </div>

              <div>
                <h2 className="text-3xl leading-tight !text-white">
                  Conecte sua família às melhores profissionais de cuidado.
                </h2>
                <p className="mt-3 text-sm leading-relaxed !text-white/90">
                  Plataforma para famílias, babás e cuidadoras de idosos. Cadastro local exige aprovação admin.
                </p>
              </div>

              <ul className="space-y-2 text-sm !text-white/95">
                <li className="inline-flex items-center gap-2">
                  <AppIcon icon={LockKeyhole} size="sm" />
                  Login social e local disponíveis
                </li>
                <li className="inline-flex items-center gap-2">
                  <AppIcon icon={BadgeCheck} size="sm" />
                  Cadastro local exige aprovação admin
                </li>
                <li className="inline-flex items-center gap-2">
                  <AppIcon icon={BadgeCheck} size="sm" />
                  Jornada com moderação e reputação
                </li>
              </ul>
            </div>
          </aside>

          <section className="theme-card p-6 sm:p-8 lg:p-10">
            <p className="theme-chip theme-chip-blue">Login</p>
            <h1 className="mt-4 text-3xl sm:text-4xl">Escolha como entrar</h1>
            <p className="mt-3 max-w-[58ch] text-sm leading-relaxed text-[var(--theme-muted)]">
              Use seu método preferido para login. Se ainda não tiver conta local, crie seu cadastro abaixo.
            </p>

            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: nextPath });
              }}
              className="mt-6"
            >
              <CtaButton type="submit" className="w-full" size="lg" icon={LogIn}>
                Continuar com Google
              </CtaButton>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.08em] text-[var(--theme-muted)]">
              <span className="theme-divider flex-1" />
              <span>ou</span>
              <span className="theme-divider flex-1" />
            </div>

            <CredentialsLoginForm
              nextPath={nextPath}
              initialCode={resolvedSearchParams.code}
              initialError={resolvedSearchParams.error}
            />

            {/* Signup paths — differentiated by user type */}
            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.07em] text-[var(--theme-muted)]">
                Ainda não tem conta? Escolha seu perfil:
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Família */}
                <a
                  href={`/signup?tipo=FAMILY&next=${encodeURIComponent(nextPath)}`}
                  id="signup-family-btn"
                  className="group flex flex-col gap-2 rounded-2xl border-2 border-[var(--theme-border)] bg-[var(--theme-cream)] px-4 py-3 text-left transition-all hover:border-[var(--theme-indigo)] hover:bg-white"
                >
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--theme-navy)] group-hover:text-[var(--theme-indigo)]">
                    <AppIcon icon={Users} size="sm" />
                    Sou família
                  </span>
                  <span className="text-xs leading-relaxed text-[var(--theme-muted)]">
                    Quero contratar uma babá ou cuidadora de idosos.
                  </span>
                </a>

                {/* Profissional */}
                <div className="flex flex-col gap-2 rounded-2xl border-2 border-[var(--theme-border)] bg-[var(--theme-cream)] px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--theme-navy)]">
                    <AppIcon icon={HeartHandshake} size="sm" />
                    Sou profissional
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/signup?tipo=PROFESSIONAL&subtipo=BABYSITTER&next=${encodeURIComponent(nextPath)}`}
                      id="signup-babysitter-btn"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--theme-border)] bg-white px-3 py-1 text-xs font-medium text-[var(--theme-body)] transition-all hover:border-[var(--theme-indigo)] hover:text-[var(--theme-indigo)]"
                    >
                      <AppIcon icon={Baby} size="sm" />
                      Babá
                    </a>
                    <a
                      href={`/signup?tipo=PROFESSIONAL&subtipo=ELDER_CAREGIVER&next=${encodeURIComponent(nextPath)}`}
                      id="signup-caregiver-btn"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--theme-border)] bg-white px-3 py-1 text-xs font-medium text-[var(--theme-body)] transition-all hover:border-[var(--theme-indigo)] hover:text-[var(--theme-indigo)]"
                    >
                      <AppIcon icon={HeartHandshake} size="sm" />
                      Cuidadora de idosos
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
