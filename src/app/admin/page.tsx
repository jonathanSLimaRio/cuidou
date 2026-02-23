import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [pendingDocs, openReports, totalUsers, openJobs] = await Promise.all([
    prisma.professionalDocument.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.report.count({ where: { status: { in: ["OPEN", "IN_REVIEW"] } } }),
    prisma.user.count(),
    prisma.jobPost.count({ where: { status: "OPEN" } }),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Painel Admin</h1>
      <p className="mt-2 text-zinc-600">Moderação e operação da plataforma.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Docs em revisão" value={pendingDocs} />
        <Card title="Denúncias abertas" value={openReports} />
        <Card title="Usuários" value={totalUsers} />
        <Card title="Vagas abertas" value={openJobs} />
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-5">
      <p className="text-sm text-zinc-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-900">{value}</p>
    </section>
  );
}
