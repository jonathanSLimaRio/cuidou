import { auth, signIn } from "@/auth";
import { BlobDecor } from "@/components/theme/blob-decor";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="theme-page">
      <div className="theme-container">
        <div className="theme-auth-shell">
          <aside className="theme-auth-side p-8">
            <BlobDecor tone="pink" className="-right-8 top-5 h-28 w-28 opacity-75" />
            <BlobDecor tone="yellow" className="-left-6 bottom-6 h-24 w-24 opacity-75" />
            <div className="relative flex flex-col justify-between gap-6">
              <p className="theme-chip theme-chip-pink w-fit">Acesso seguro</p>
              <div>
                <h2 className="text-3xl font-display leading-tight text-white">
                  Entre na Cuidou e acompanhe todo o fluxo de contratação.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-white/85">
                  Use sua conta Google para acessar vagas, candidaturas, contratos e mensagens.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-white/85">
                <li>• Sem senha local na V1</li>
                <li>• Perfil por papel único</li>
                <li>• Jornada com moderação e reputação</li>
              </ul>
            </div>
          </aside>

          <section className="theme-card p-6 sm:p-8">
            <p className="theme-chip theme-chip-blue">Login</p>
            <h1 className="mt-4 text-3xl font-display text-[var(--theme-navy)] sm:text-4xl">
              Entrar na Cuidou
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--theme-muted)]">
              Login social com Google para famílias, profissionais e administradores.
            </p>

            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
              className="mt-7"
            >
              <button type="submit" className="btn-primary w-full">
                Continuar com Google
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
