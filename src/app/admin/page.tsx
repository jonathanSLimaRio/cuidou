import { auth } from "@/auth";
import { getAdminMetrics, MetricsWindow } from "@/lib/admin-metrics";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  window?: string;
}>;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const windowParam = resolvedSearchParams.window;
  const windowDays: MetricsWindow =
    windowParam === "7" || windowParam === "90" ? Number(windowParam) as MetricsWindow : 30;

  const [pendingDocs, openReports, totalUsers, openJobs, metrics] = await Promise.all([
    prisma.professionalDocument.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.report.count({ where: { status: { in: ["OPEN", "IN_REVIEW"] } } }),
    prisma.user.count(),
    prisma.jobPost.count({ where: { status: "OPEN" } }),
    getAdminMetrics(windowDays),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Painel Admin</h1>
      <p className="mt-2 text-zinc-600">Moderação, operação e métricas da plataforma.</p>

      <div className="mt-5 flex items-center gap-2 text-sm">
        <span className="text-zinc-600">Janela de análise:</span>
        {[7, 30, 90].map((value) => {
          const isActive = value === metrics.windowDays;
          return (
            <Link
              key={value}
              href={`/admin?window=${value}`}
              className={`rounded-md px-3 py-1.5 ${
                isActive
                  ? "bg-zinc-900 text-white"
                  : "border border-black/10 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {value} dias
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Docs em revisão" value={pendingDocs.toString()} />
        <Card title="Denúncias abertas" value={openReports.toString()} />
        <Card title="Usuários" value={totalUsers.toString()} />
        <Card title="Vagas abertas" value={openJobs.toString()} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          title="Tempo médio até contratar"
          value={
            metrics.averageTimeToHireHours === null
              ? "-"
              : `${metrics.averageTimeToHireHours}h`
          }
        />
        <Card title="Taxa de resposta em 24h" value={`${metrics.responseRate24h}%`} />
        <Card
          title="Contratos em andamento"
          value={metrics.contractsByStatus.IN_PROGRESS.toString()}
        />
      </div>

      <section className="mt-8 rounded-xl border border-black/10 bg-white p-5">
        <h2 className="text-lg font-medium text-zinc-900">Denúncias por tipo</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[500px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-black/10 bg-zinc-50 p-2 text-left">Tipo</th>
                <th className="border border-black/10 bg-zinc-50 p-2 text-left">Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metrics.reportsByTargetType).map(([type, count]) => (
                <tr key={type}>
                  <td className="border border-black/10 p-2">{type}</td>
                  <td className="border border-black/10 p-2">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 bg-white p-5">
        <h2 className="text-lg font-medium text-zinc-900">Tendência diária de candidaturas</h2>
        <ul className="mt-3 space-y-1 text-sm text-zinc-700">
          {metrics.applicationsTrendDaily.length === 0 ? (
            <li>Sem candidaturas no período selecionado.</li>
          ) : (
            metrics.applicationsTrendDaily.map((entry) => (
              <li key={entry.date}>
                {entry.date}: {entry.count}
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-5">
      <p className="text-sm text-zinc-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-900">{value}</p>
    </section>
  );
}
