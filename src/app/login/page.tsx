import { auth, signIn } from "@/auth";
import { AppIcon } from "@/components/theme/app-icon";
import { BlobDecor } from "@/components/theme/blob-decor";
import { CtaButton } from "@/components/theme/cta-button";
import { resolveDesignImage } from "@/lib/design-media";
import { getWordPressMediaGallery } from "@/lib/wordpress-content";
import { BadgeCheck, LockKeyhole, LogIn } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const gallery = await getWordPressMediaGallery(20);
  const heroImage = resolveDesignImage("loginHero", gallery, 2, "Família e profissional de cuidado");

  return (
    <main className="theme-page">
      <div className="theme-container">
        <div className="theme-auth-shell">
          <aside className="theme-auth-side p-8">
            <BlobDecor tone="pink" className="-right-8 top-5 h-28 w-28 opacity-75" />
            <BlobDecor tone="yellow" className="-left-6 bottom-6 h-24 w-24 opacity-75" />

            <div className="relative flex w-full flex-col gap-6">
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
                <h2 className="text-3xl leading-tight text-white">
                  Entre na Cuidou e acompanhe todo o fluxo de contratação.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/85">
                  Use sua conta Google para acessar vagas, candidaturas, contratos e mensagens.
                </p>
              </div>

              <ul className="space-y-2 text-sm text-white/85">
                <li className="inline-flex items-center gap-2">
                  <AppIcon icon={LockKeyhole} size="sm" />
                  Sem senha local na V1
                </li>
                <li className="inline-flex items-center gap-2">
                  <AppIcon icon={BadgeCheck} size="sm" />
                  Perfil por papel único
                </li>
                <li className="inline-flex items-center gap-2">
                  <AppIcon icon={BadgeCheck} size="sm" />
                  Jornada com moderação e reputação
                </li>
              </ul>
            </div>
          </aside>

          <section className="theme-card p-6 sm:p-8">
            <p className="theme-chip theme-chip-blue">Login</p>
            <h1 className="mt-4 text-3xl sm:text-4xl">Entrar na Cuidou</h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--theme-muted)]">
              Login social com Google para famílias, profissionais e administradores.
            </p>

            <div className="mt-6 space-y-3 text-sm text-[var(--theme-body)]">
              <div className="theme-card-soft rounded-2xl px-4 py-3">
                Sua sessão será protegida e sincronizada entre desktop e mobile.
              </div>
              <div className="theme-card-soft rounded-2xl px-4 py-3">
                Após login, você continua do ponto exato da sua jornada.
              </div>
            </div>

            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
              className="mt-7"
            >
              <CtaButton type="submit" className="w-full" size="lg" icon={LogIn}>
                Continuar com Google
              </CtaButton>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
