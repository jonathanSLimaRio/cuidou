import { CtaButton } from "@/components/theme/cta-button";
import { PageHero } from "@/components/theme/page-hero";
import { SectionShell } from "@/components/theme/section-shell";
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
    <main className="theme-page">
      <div className="theme-container space-y-6">
        <PageHero
          eyebrow="Marketplace público"
          title="Profissionais verificados"
          description="Babás e cuidadoras de idosos com selo de verificação e informações atualizadas de perfil."
          actions={<CtaButton href="/marketplace/jobs" variant="outline">Explorar vagas</CtaButton>}
          sideContent={
            <div className="rounded-3xl border border-[var(--theme-border)] bg-white px-4 py-3 text-sm text-[var(--theme-body)]">
              <p className="font-display text-lg text-[var(--theme-indigo)]">
                {professionals.length} perfis verificados
              </p>
              <p className="mt-1">Contatos permanecem protegidos até aprovação de candidatura.</p>
            </div>
          }
        />

        <SectionShell tone="light">
          {professionals.length === 0 ? (
            <div className="theme-card-soft rounded-3xl p-6 text-center">
              <p className="theme-chip theme-chip-blue mx-auto w-fit">Sem resultados</p>
              <h2 className="mt-4 text-2xl font-display text-[var(--theme-navy)]">
                Nenhum profissional verificado no momento
              </h2>
              <p className="mt-2 text-sm text-[var(--theme-muted)]">
                Assim que novos perfis forem aprovados, eles aparecerão aqui.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {professionals.map((professional) => (
                <li key={professional.id} className="theme-list-card p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="theme-chip theme-chip-indigo">Verificado</span>
                    <span className="theme-chip theme-chip-yellow">
                      {professional.city}/{professional.state}
                    </span>
                    {professional.serviceTypes.map((serviceType) => (
                      <span key={serviceType} className="theme-chip theme-chip-blue">
                        {serviceType}
                      </span>
                    ))}
                  </div>

                  <h2 className="mt-4 text-2xl font-display text-[var(--theme-navy)]">
                    {professional.user.name ?? "Profissional"}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--theme-body)]">
                    {professional.bio ?? "Sem bio cadastrada."}
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
