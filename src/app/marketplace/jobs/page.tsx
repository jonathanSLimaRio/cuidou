import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MarketplaceJobsPage() {
  const jobs = await prisma.jobPost.findMany({
    where: {
      status: "OPEN",
      isVisible: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      family: {
        select: {
          name: true,
        },
      },
    },
    take: 50,
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Vagas abertas</h1>
      <p className="mt-2 text-zinc-600">Marketplace público de oportunidades.</p>

      <ul className="mt-6 space-y-3">
        {jobs.length === 0 ? (
          <li className="rounded-lg border border-black/10 bg-white p-4 text-sm text-zinc-600">
            Nenhuma vaga disponível no momento.
          </li>
        ) : (
          jobs.map((job) => (
            <li key={job.id} className="rounded-lg border border-black/10 bg-white p-4">
              <p className="font-medium text-zinc-900">{job.title}</p>
              <p className="text-sm text-zinc-600">{job.city}/{job.state}</p>
              <p className="mt-2 text-sm text-zinc-700">{job.description}</p>
              <p className="mt-2 text-xs text-zinc-500">Família: {job.family.name ?? "Anônimo"}</p>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
