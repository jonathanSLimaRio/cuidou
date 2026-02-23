import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfessionalAreaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "PROFESSIONAL") {
    redirect("/dashboard");
  }

  const [profile, applications] = await Promise.all([
    prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        documents: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
      },
    }),
    prisma.jobApplication.findMany({
      where: { professionalId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
          },
        },
      },
      take: 20,
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Área do Profissional</h1>
      <p className="mt-2 text-zinc-600">Atualize perfil, documentos e candidaturas.</p>

      <section className="mt-8 rounded-xl border border-black/10 bg-white p-5">
        <h2 className="text-lg font-medium text-zinc-900">Perfil profissional</h2>
        <p className="mt-2 text-sm text-zinc-700">
          Verificação: {profile?.verificationStatus ?? "NOT_SUBMITTED"}
        </p>
        <p className="text-sm text-zinc-700">
          Localização: {profile?.city ?? "-"} / {profile?.state ?? "-"}
        </p>
        <p className="text-sm text-zinc-700">
          Especialidades: {profile?.serviceTypes.join(", ") || "não definidas"}
        </p>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-zinc-900">Candidaturas enviadas</h2>
          <Link
            href="/marketplace/jobs"
            className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
          >
            Buscar vagas
          </Link>
        </div>

        <ul className="mt-4 space-y-3">
          {applications.length === 0 ? (
            <li className="text-sm text-zinc-600">Nenhuma candidatura enviada ainda.</li>
          ) : (
            applications.map((application) => (
              <li key={application.id} className="rounded-lg border border-black/10 p-4">
                <p className="font-medium text-zinc-900">{application.job.title}</p>
                <p className="text-sm text-zinc-600">
                  {application.job.city}/{application.job.state} - {application.status}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
