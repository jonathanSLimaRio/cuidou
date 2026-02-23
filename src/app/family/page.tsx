import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FamilyContractsPanel } from "./contracts-panel";

export const dynamic = "force-dynamic";

export default async function FamilyAreaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "FAMILY") {
    redirect("/dashboard");
  }

  const [profile, jobs, contracts] = await Promise.all([
    prisma.familyProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.jobPost.findMany({
      where: { familyId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
      take: 20,
    }),
    prisma.contract.findMany({
      where: {
        familyId: session.user.id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          select: {
            title: true,
          },
        },
        professional: {
          select: {
            name: true,
          },
        },
      },
      take: 30,
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Área da Família</h1>
      <p className="mt-2 text-zinc-600">Gerencie perfil, vagas, candidaturas e contratos.</p>

      <section className="mt-8 rounded-xl border border-black/10 bg-white p-5">
        <h2 className="text-lg font-medium text-zinc-900">Perfil</h2>
        <p className="mt-2 text-sm text-zinc-700">
          Contato: {profile?.contactName ?? "não preenchido"}
        </p>
        <p className="text-sm text-zinc-700">
          Localização: {profile?.city ?? "-"} / {profile?.state ?? "-"}
        </p>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-zinc-900">Minhas vagas</h2>
          <Link
            href="/marketplace/jobs"
            className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
          >
            Ver marketplace
          </Link>
        </div>

        <ul className="mt-4 space-y-3">
          {jobs.length === 0 ? (
            <li className="text-sm text-zinc-600">Nenhuma vaga criada ainda.</li>
          ) : (
            jobs.map((job) => (
              <li key={job.id} className="rounded-lg border border-black/10 p-4">
                <p className="font-medium text-zinc-900">{job.title}</p>
                <p className="text-sm text-zinc-600">
                  {job.city}/{job.state} - {job.status} - {job._count.applications} candidatura(s)
                </p>
              </li>
            ))
          )}
        </ul>
      </section>

      <FamilyContractsPanel
        initialContracts={contracts.map((contract) => ({
          ...contract,
          createdAt: contract.createdAt.toISOString(),
          startedAt: contract.startedAt.toISOString(),
          completedAt: contract.completedAt?.toISOString() ?? null,
          canceledAt: contract.canceledAt?.toISOString() ?? null,
        }))}
      />
    </main>
  );
}
