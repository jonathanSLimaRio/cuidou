import { auth } from "@/auth";
import { CtaButton } from "@/components/theme/cta-button";
import { PageHero } from "@/components/theme/page-hero";
import { SectionShell } from "@/components/theme/section-shell";
import { prisma } from "@/lib/prisma";
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
    <main className="theme-page">
      <div className="theme-container space-y-6">
        <PageHero
          eyebrow="Área da família"
          title="Gerencie contratações com visão completa"
          description="Acompanhe seu perfil, vagas publicadas, candidaturas recebidas e contratos em andamento."
          actions={
            <>
              <CtaButton href="/dashboard">Voltar ao dashboard</CtaButton>
              <CtaButton href="/marketplace/jobs" variant="outline">
                Ver marketplace
              </CtaButton>
            </>
          }
        />

        <SectionShell tone="light" eyebrow="Perfil" title="Dados da família">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="theme-list-card">
              <p className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Contato</p>
              <p className="mt-2 text-lg font-display text-[var(--theme-navy)]">
                {profile?.contactName ?? "Não preenchido"}
              </p>
            </div>
            <div className="theme-list-card">
              <p className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Localização</p>
              <p className="mt-2 text-lg font-display text-[var(--theme-navy)]">
                {profile?.city ?? "-"} / {profile?.state ?? "-"}
              </p>
            </div>
          </div>
        </SectionShell>

        <SectionShell
          tone="tint"
          eyebrow="Vagas"
          title="Minhas vagas publicadas"
          description="Visão rápida de status e volume de candidaturas para cada vaga."
        >
          {jobs.length === 0 ? (
            <div className="theme-card-soft rounded-3xl p-5 text-sm text-[var(--theme-muted)]">
              Nenhuma vaga criada ainda.
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {jobs.map((job) => (
                <li key={job.id} className="theme-list-card p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="theme-chip theme-chip-blue">{job.city}/{job.state}</span>
                    <span className="theme-chip theme-chip-pink">{job.status}</span>
                  </div>

                  <h2 className="mt-4 text-2xl font-display text-[var(--theme-navy)]">{job.title}</h2>
                  <p className="mt-2 text-sm text-[var(--theme-body)]">
                    {job._count.applications} candidatura(s) recebida(s)
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionShell>

        <FamilyContractsPanel
          initialContracts={contracts.map((contract) => ({
            ...contract,
            createdAt: contract.createdAt.toISOString(),
            startedAt: contract.startedAt.toISOString(),
            completedAt: contract.completedAt?.toISOString() ?? null,
            canceledAt: contract.canceledAt?.toISOString() ?? null,
          }))}
        />
      </div>
    </main>
  );
}
