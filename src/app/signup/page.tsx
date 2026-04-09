import { auth } from "@/auth";
import { SignupForm } from "@/components/auth/signup-form";
import { AppIcon } from "@/components/theme/app-icon";
import { BlobDecor } from "@/components/theme/blob-decor";
import { resolveDesignImage } from "@/lib/design-media";
import { getWordPressMediaGallery } from "@/lib/wordpress-content";
import { BadgeCheck, Clock4, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  next?: string;
  tipo?: string;
  subtipo?: string;
}>;

export default async function SignupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = resolvedSearchParams.next || "/dashboard";
  const tipoParam = resolvedSearchParams.tipo;
  const subtipoParam = resolvedSearchParams.subtipo;

  // Normalise to valid UserRole values or undefined
  const presetRole: "FAMILY" | "PROFESSIONAL" | undefined =
    tipoParam === "FAMILY"
      ? "FAMILY"
      : tipoParam === "PROFESSIONAL"
        ? "PROFESSIONAL"
        : undefined;

  const presetSubtype: "BABYSITTER" | "ELDER_CAREGIVER" | undefined =
    subtipoParam === "BABYSITTER"
      ? "BABYSITTER"
      : subtipoParam === "ELDER_CAREGIVER"
        ? "ELDER_CAREGIVER"
        : undefined;

  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const gallery = await getWordPressMediaGallery(20);
  const heroImage = resolveDesignImage("onboardingHero", gallery, 3, "Cadastro local com aprovação");

  const roleLabel =
    presetRole === "FAMILY"
      ? "Sou família"
      : presetRole === "PROFESSIONAL"
        ? presetSubtype === "BABYSITTER"
          ? "Sou babá"
          : presetSubtype === "ELDER_CAREGIVER"
            ? "Sou cuidadora de idosos"
            : "Sou profissional"
        : "Cadastro";

  return (
    <main className="theme-page">
      <div className="theme-container">
        <div className="theme-auth-shell">
          <aside className="theme-auth-side p-8">
            <BlobDecor tone="blue" className="-right-8 top-6 h-28 w-28 opacity-75" />
            <BlobDecor tone="pink" className="-left-6 bottom-6 h-24 w-24 opacity-75" />

            <div className="relative flex w-full flex-col gap-6">
              <p className="theme-chip theme-chip-yellow w-fit">{roleLabel}</p>

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
                  Crie sua conta e entre na fila de aprovação.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/85">
                  Após aprovação do admin, você poderá fazer login e concluir o onboarding.
                </p>
              </div>

              <ul className="space-y-2 text-sm text-white/85">
                <li className="inline-flex items-center gap-2">
                  <AppIcon icon={ShieldCheck} size="sm" />
                  Senha segura com hash no banco
                </li>
                <li className="inline-flex items-center gap-2">
                  <AppIcon icon={Clock4} size="sm" />
                  Status inicial: pendente de aprovação
                </li>
                <li className="inline-flex items-center gap-2">
                  <AppIcon icon={BadgeCheck} size="sm" />
                  Ativação liberada pela equipe admin
                </li>
              </ul>
            </div>
          </aside>

          <section className="theme-card p-6 sm:p-8">
            <p className="theme-chip theme-chip-blue">Signup</p>
            <h1 className="mt-4 text-3xl sm:text-4xl">Criar conta local</h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--theme-muted)]">
              Complete os dados abaixo para solicitar aprovação de acesso.
            </p>

            <SignupForm
              nextPath={nextPath}
              presetRole={presetRole}
              presetSubtype={presetSubtype}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
