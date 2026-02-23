import { CtaButton } from "@/components/theme/cta-button";
import { PageHero } from "@/components/theme/page-hero";
import { SectionShell } from "@/components/theme/section-shell";
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
    <main className="theme-page">
      <div className="theme-container space-y-6">
        <PageHero
          eyebrow="Marketplace público"
          title="Vagas abertas"
          description="Explore oportunidades para babás e cuidadoras de idosos em diferentes cidades."
          actions={<CtaButton href="/login" variant="outline">Entrar para se candidatar</CtaButton>}
          sideContent={
            <div className="rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-cream)] px-4 py-3 text-sm text-[var(--theme-body)]">
              <p className="font-display text-lg text-[var(--theme-indigo)]">{jobs.length} vagas visíveis</p>
              <p className="mt-1">Atualização contínua conforme famílias publicam novas necessidades.</p>
            </div>
          }
        />

        <SectionShell tone="light">
          {jobs.length === 0 ? (
            <div className="theme-card-soft rounded-3xl p-6 text-center">
              <p className="theme-chip theme-chip-yellow mx-auto w-fit">Sem resultados</p>
              <h2 className="mt-4 text-2xl font-display text-[var(--theme-navy)]">
                Nenhuma vaga disponível no momento
              </h2>
              <p className="mt-2 text-sm text-[var(--theme-muted)]">
                Novas vagas aparecem aqui assim que forem publicadas por famílias.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {jobs.map((job) => (
                <li key={job.id} className="theme-list-card p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="theme-chip theme-chip-blue">{job.serviceType}</span>
                    <span className="theme-chip theme-chip-pink">
                      {job.city}/{job.state}
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-display text-[var(--theme-navy)]">{job.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--theme-body)]">
                    {job.description}
                  </p>

                  <div className="mt-4 theme-divider" />
                  <p className="mt-3 text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">
                    Família: {job.family.name ?? "Anônimo"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionShell>
      </div>
    </main>
  );
}
