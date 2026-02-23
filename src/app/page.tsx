import { auth, signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  const [openJobs, verifiedProfessionals] = await Promise.all([
    prisma.jobPost.count({ where: { status: "OPEN", isVisible: true } }),
    prisma.professionalProfile.count({ where: { verificationStatus: "VERIFIED" } }),
  ]);

  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
        <div className="max-w-3xl space-y-5">
          <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            Marketplace sem pagamento na plataforma
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            Conecte famílias, babás e cuidadoras de idosos com segurança
          </h1>
          <p className="text-lg text-zinc-600">
            A Cuidou centraliza vagas, candidaturas, moderação, chat e avaliações
            para contratação de cuidado infantil e cuidado de idosos.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="rounded-xl border border-black/10 bg-white p-5">
            <p className="text-sm text-zinc-500">Vagas abertas</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-900">{openJobs}</p>
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-5">
            <p className="text-sm text-zinc-500">Profissionais verificados</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-900">
              {verifiedProfessionals}
            </p>
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-5">
            <p className="text-sm text-zinc-500">Fluxo principal</p>
            <p className="mt-2 text-sm text-zinc-700">
              Vaga - candidatura - aprovação - contato liberado - chat
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Ir para dashboard
            </Link>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Entrar com Google
              </button>
            </form>
          )}
          <Link
            href="/marketplace/jobs"
            className="rounded-lg border border-black/10 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Ver vagas
          </Link>
          <Link
            href="/marketplace/professionals"
            className="rounded-lg border border-black/10 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Ver profissionais
          </Link>
        </div>
      </section>
    </main>
  );
}
