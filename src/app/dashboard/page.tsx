import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.role) {
    redirect("/onboarding");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  if (session.user.role === "FAMILY") {
    const [jobs, conversations, notifications, contractsInProgress, contractsCompleted] =
      await Promise.all([
        prisma.jobPost.count({ where: { familyId: session.user.id } }),
        prisma.conversation.count({ where: { familyId: session.user.id } }),
        prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
        prisma.contract.count({
          where: { familyId: session.user.id, status: "IN_PROGRESS" },
        }),
        prisma.contract.count({
          where: { familyId: session.user.id, status: "COMPLETED" },
        }),
      ]);

    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard da Família</h1>
        <p className="mt-2 text-zinc-600">Gerencie vagas, contratos, candidaturas e conversas.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card title="Vagas criadas" value={jobs} />
          <Card title="Conversas" value={conversations} />
          <Card title="Notificações não lidas" value={notifications} />
          <Card title="Contratos ativos" value={contractsInProgress} />
          <Card title="Contratos concluídos" value={contractsCompleted} />
        </div>

        <div className="mt-8 flex gap-3">
          <Link href="/family" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white">
            Ir para área da família
          </Link>
          <Link
            href="/marketplace/jobs"
            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm text-zinc-800"
          >
            Ver vagas públicas
          </Link>
          <Link href="/chat" className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm text-zinc-800">
            Abrir chat
          </Link>
        </div>
      </main>
    );
  }

  const [applications, conversations, notifications, contractsInProgress, contractsCompleted] =
    await Promise.all([
      prisma.jobApplication.count({ where: { professionalId: session.user.id } }),
      prisma.conversation.count({ where: { professionalId: session.user.id } }),
      prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
      prisma.contract.count({
        where: { professionalId: session.user.id, status: "IN_PROGRESS" },
      }),
      prisma.contract.count({
        where: { professionalId: session.user.id, status: "COMPLETED" },
      }),
    ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Dashboard do Profissional</h1>
      <p className="mt-2 text-zinc-600">Acompanhe candidaturas, contratos e conversas.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card title="Candidaturas" value={applications} />
        <Card title="Conversas" value={conversations} />
        <Card title="Notificações não lidas" value={notifications} />
        <Card title="Contratos ativos" value={contractsInProgress} />
        <Card title="Contratos concluídos" value={contractsCompleted} />
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/professional" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white">
          Ir para área profissional
        </Link>
        <Link
          href="/marketplace/jobs"
          className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm text-zinc-800"
        >
          Buscar vagas
        </Link>
        <Link href="/chat" className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm text-zinc-800">
          Abrir chat
        </Link>
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5">
      <p className="text-sm text-zinc-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
