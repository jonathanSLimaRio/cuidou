import { CtaButton } from "@/components/theme/cta-button";
import { MetricCard } from "@/components/theme/metric-card";
import { PageHeader } from "@/components/theme/page-header";
import { SectionShell } from "@/components/theme/section-shell";
import { prisma } from "@/lib/prisma";
import { VerificationStatus } from "@prisma/client";
import { BriefcaseBusiness, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const [openJobsCount, verifiedProfessionalsCount] = await Promise.all([
    prisma.jobPost.count({ where: { status: "OPEN", isVisible: true } }),
    prisma.professionalProfile.count({
      where: { verificationStatus: VerificationStatus.VERIFIED },
    }),
  ]);

  return (
    <main className="theme-page">
      <div className="theme-container space-y-6">
        <PageHeader
          eyebrow="Marketplace público"
          title="Encontre cuidado com segurança"
          description="Conectamos famílias a babás e cuidadoras de idosos verificadas. Explore vagas abertas ou procure profissionais disponíveis na sua região."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Marketplace" }]}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            label="Vagas abertas"
            value={openJobsCount}
            hint="Oportunidades publicadas por famílias aguardando candidaturas."
            tone="pink"
          />
          <MetricCard
            label="Profissionais verificados"
            value={verifiedProfessionalsCount}
            hint="Perfis com documentação revisada e aprovada pela equipe Cuidou."
            tone="blue"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <SectionShell
            eyebrow="Para profissionais"
            title="Vagas abertas"
            description="Explore oportunidades publicadas por famílias. Filtre por serviço, estado e cidade para encontrar vagas compatíveis com sua disponibilidade."
            tone="tint"
          >
            <CtaButton href="/marketplace/jobs" icon={BriefcaseBusiness} variant="primary">
              Ver todas as vagas
            </CtaButton>
          </SectionShell>

          <SectionShell
            eyebrow="Para famílias"
            title="Profissionais disponíveis"
            description="Veja perfis com especialidade, disponibilidade semanal e status de verificação. Conheça quem está pronto para cuidar da sua família."
            tone="deep"
          >
            <CtaButton href="/marketplace/professionals" icon={Users} variant="light">
              Ver profissionais
            </CtaButton>
          </SectionShell>
        </div>
      </div>
    </main>
  );
}
