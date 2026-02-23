import { auth } from "@/auth";
import { BlobDecor } from "@/components/theme/blob-decor";
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

  return (
    <main className="theme-page">
      <div className="theme-container">
        <div className="theme-auth-shell">
          <aside className="theme-auth-side p-8">
            <BlobDecor tone="blue" className="-right-8 top-7 h-24 w-24 opacity-75" />
            <BlobDecor tone="pink" className="-left-5 bottom-8 h-24 w-24 opacity-70" />

            <div className="relative flex h-full flex-col justify-between gap-6">
              <p className="theme-chip theme-chip-yellow w-fit">Onboarding</p>
              <div>
                <h2 className="text-3xl font-display leading-tight text-white">
                  Defina seu papel para começar a usar a plataforma.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-white/85">
                  Nesta versão, cada conta possui papel único: família ou profissional.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-white/85">
                <li>• Escolha fixa na V1</li>
                <li>• Termos e privacidade obrigatórios</li>
                <li>• Redirecionamento automático após salvar</li>
              </ul>
            </div>
          </aside>

          <section className="theme-card p-6 sm:p-8">
            <p className="theme-chip theme-chip-pink">Passo inicial</p>
            <h1 className="mt-4 text-3xl font-display text-[var(--theme-navy)] sm:text-4xl">
              Defina seu perfil
            </h1>
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
