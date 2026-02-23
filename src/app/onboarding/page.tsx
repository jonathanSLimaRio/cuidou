import { auth } from "@/auth";
import { AppIcon } from "@/components/theme/app-icon";
import { BlobDecor } from "@/components/theme/blob-decor";
import { resolveDesignImage } from "@/lib/design-media";
import { getWordPressMediaGallery } from "@/lib/wordpress-content";
import { BadgeCheck, FileCheck2, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { OnboardingRoleForm } from "./role-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "FAMILY") {
    redirect("/family");
  }

  if (session.user.role === "PROFESSIONAL") {
    redirect("/professional");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  const gallery = await getWordPressMediaGallery(24);
  const image = resolveDesignImage("onboardingHero", gallery, 4, "Família e profissional de cuidado");

  return (
    <main className="theme-page">
      <div className="theme-container">
        <div className="theme-auth-shell">
          <aside className="theme-auth-side p-8">
            <BlobDecor tone="blue" className="-right-8 top-7 h-24 w-24 opacity-75" />
            <BlobDecor tone="pink" className="-left-5 bottom-8 h-24 w-24 opacity-70" />

            <div className="relative flex h-full flex-col gap-6">
              <p className="theme-chip theme-chip-yellow w-fit">Onboarding</p>

              <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/12 p-2">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-white/20">
                  {image ? (
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>
              </div>

              <div>
                <h2 className="text-3xl leading-tight text-white">
                  Defina seu papel para começar a usar a plataforma.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-white/85">
                  Nesta versão, cada conta possui papel único: família ou profissional.
                </p>
              </div>

              <ul className="space-y-2 text-sm text-white/85">
                <li className="inline-flex items-center gap-2">
                  <AppIcon icon={BadgeCheck} size="sm" />
                  Escolha fixa na V1
                </li>
                <li className="inline-flex items-center gap-2">
                  <AppIcon icon={FileCheck2} size="sm" />
                  Termos e privacidade obrigatórios
                </li>
                <li className="inline-flex items-center gap-2">
                  <AppIcon icon={ShieldCheck} size="sm" />
                  Redirecionamento automático após salvar
                </li>
              </ul>
            </div>
          </aside>

          <section className="theme-card p-6 sm:p-8">
            <p className="theme-chip theme-chip-pink">Passo inicial</p>
            <h1 className="mt-4 text-3xl sm:text-4xl">Defina seu perfil</h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--theme-muted)]">
              Escolha como você quer usar a Cuidou. Depois, concluímos o onboarding em um clique.
            </p>
            <OnboardingRoleForm />
          </section>
        </div>
      </div>
    </main>
  );
}
