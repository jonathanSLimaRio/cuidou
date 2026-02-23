import { auth } from "@/auth";
import { AppShell } from "@/components/theme/app-shell";
import { CtaButton } from "@/components/theme/cta-button";
import { EmptyState } from "@/components/theme/empty-state";
import { PageHeader } from "@/components/theme/page-header";
import { StatusBadge } from "@/components/theme/status-badge";
import { prisma } from "@/lib/prisma";
import { LayoutDashboard, Search, Users } from "lucide-react";
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
    <AppShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Dashboard", href: "/dashboard" },
        { label: "Família" },
      ]}
    >
      <PageHeader
        eyebrow="Área da família"
        title="Gerencie contratações com visão completa"
        description="Acompanhe perfil, vagas publicadas, candidaturas recebidas e contratos em andamento."
        actions={
          <>
            <CtaButton href="/dashboard" variant="outline" icon={LayoutDashboard}>
              Voltar ao dashboard
            </CtaButton>
            <CtaButton href="/marketplace/jobs" icon={Search}>
              Ver marketplace
            </CtaButton>
          </>
        }
      />

      <section className="grid gap-3 md:grid-cols-2">
        <article className="theme-card-soft rounded-3xl px-5 py-5">
          <p className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Contato principal</p>
          <p className="mt-2 text-2xl">{profile?.contactName ?? "Não preenchido"}</p>
          <p className="mt-2 text-sm text-[var(--theme-body)]">
            Atualize esse campo para agilizar retorno em processos de candidatura.
          </p>
        </article>

        <article className="theme-card-soft rounded-3xl px-5 py-5">
          <p className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Localização</p>
          <p className="mt-2 text-2xl">
            {profile?.city ?? "-"} / {profile?.state ?? "-"}
          </p>
          <p className="mt-2 text-sm text-[var(--theme-body)]">
            Localização impacta descoberta de profissionais e qualidade das candidaturas.
          </p>
        </article>
      </section>

      <section className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="theme-chip theme-chip-blue">Vagas</p>
            <h2 className="mt-3 text-3xl">Minhas vagas publicadas</h2>
            <p className="mt-2 text-sm text-[var(--theme-body)]">
              Acompanhe status e volume de candidaturas por vaga.
            </p>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="Nenhuma vaga criada ainda"
              description="Crie sua primeira vaga para começar a receber candidaturas de profissionais no marketplace."
              action={
                <CtaButton href="/marketplace/jobs" icon={Users}>
                  Explorar vagas públicas
                </CtaButton>
              }
              icon="vagas"
            />
          </div>
        ) : (
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <li key={job.id} className="theme-list-card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone="blue">
                    {job.city}/{job.state}
                  </StatusBadge>
                  <StatusBadge tone={job.status === "OPEN" ? "success" : "warning"}>{job.status}</StatusBadge>
                </div>

                <h3 className="mt-3 text-2xl leading-tight">{job.title}</h3>
                <p className="mt-2 text-sm text-[var(--theme-body)]">
                  {job._count.applications} candidatura(s) recebida(s)
                </p>
              </li>
            ))}
          </ul>
        )}
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
    </AppShell>
  );
}
