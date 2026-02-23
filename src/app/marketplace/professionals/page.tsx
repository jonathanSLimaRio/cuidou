import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MarketplaceProfessionalsPage() {
  const professionals = await prisma.professionalProfile.findMany({
    where: {
      verificationStatus: "VERIFIED",
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
    take: 50,
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Profissionais verificados</h1>
      <p className="mt-2 text-zinc-600">Babás e cuidadoras de idosos com selo de verificação.</p>

      <ul className="mt-6 space-y-3">
        {professionals.length === 0 ? (
          <li className="rounded-lg border border-black/10 bg-white p-4 text-sm text-zinc-600">
            Nenhum profissional verificado no momento.
          </li>
        ) : (
          professionals.map((professional) => (
            <li key={professional.id} className="rounded-lg border border-black/10 bg-white p-4">
              <p className="font-medium text-zinc-900">{professional.user.name ?? "Profissional"}</p>
              <p className="text-sm text-zinc-600">{professional.city}/{professional.state}</p>
              <p className="mt-2 text-sm text-zinc-700">{professional.bio ?? "Sem bio"}</p>
              <p className="mt-2 text-xs text-emerald-700">Verificado</p>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
