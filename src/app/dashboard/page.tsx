import { auth } from "@/auth";
import { CtaButton } from "@/components/theme/cta-button";
import { MetricCard } from "@/components/theme/metric-card";
import { PageHero } from "@/components/theme/page-hero";
import { SectionShell } from "@/components/theme/section-shell";
import { prisma } from "@/lib/prisma";
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
      <main className="theme-page">
        <div className="theme-container space-y-6">
          <PageHero
            eyebrow="Dashboard"
            title="Painel da Família"
            description="Acompanhe vagas, candidaturas, contratos e conversas em um único espaço."
            actions={
              <>
                <CtaButton href="/family">Ir para área da família</CtaButton>
                <CtaButton href="/marketplace/jobs" variant="outline">
                  Ver vagas públicas
                </CtaButton>
                <CtaButton href="/chat" variant="soft">
                  Abrir chat
                </CtaButton>
              </>
            }
          />

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard label="Vagas criadas" value={jobs} tone="pink" />
            <MetricCard label="Conversas" value={conversations} tone="blue" />
            <MetricCard label="Notificações não lidas" value={notifications} tone="yellow" />
            <MetricCard label="Contratos ativos" value={contractsInProgress} tone="indigo" />
            <MetricCard label="Contratos concluídos" value={contractsCompleted} tone="white" />
          </section>

          <SectionShell
            tone="tint"
            eyebrow="Resumo rápido"
            title="Fluxo atual da família"
            description="Publique vagas, aprove candidaturas e conduza a contratação com histórico registrado."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <article className="theme-list-card">
                <h2 className="text-xl font-display text-[var(--theme-navy)]">Publicação de vagas</h2>
                <p className="mt-2 text-sm text-[var(--theme-body)]">
                  Crie e gerencie vagas com controle de status e volume de candidaturas.
                </p>
              </article>
              <article className="theme-list-card">
                <h2 className="text-xl font-display text-[var(--theme-navy)]">Contratos explícitos</h2>
                <p className="mt-2 text-sm text-[var(--theme-body)]">
                  Contratos seguem estados em andamento, concluído e cancelado.
                </p>
              </article>
              <article className="theme-list-card">
                <h2 className="text-xl font-display text-[var(--theme-navy)]">Contato protegido</h2>
                <p className="mt-2 text-sm text-[var(--theme-body)]">
                  Conversa privada apenas após aceite, com anexos e mensagens rápidas.
                </p>
              </article>
            </div>
          </SectionShell>
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
    <main className="theme-page">
      <div className="theme-container space-y-6">
        <PageHero
          eyebrow="Dashboard"
          title="Painel do Profissional"
          description="Acompanhe oportunidades, candidaturas enviadas, contratos e mensagens ativas."
          actions={
            <>
              <CtaButton href="/professional">Ir para área profissional</CtaButton>
              <CtaButton href="/marketplace/jobs" variant="outline">
                Buscar vagas
              </CtaButton>
              <CtaButton href="/chat" variant="soft">
                Abrir chat
              </CtaButton>
            </>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Candidaturas" value={applications} tone="pink" />
          <MetricCard label="Conversas" value={conversations} tone="blue" />
          <MetricCard label="Notificações não lidas" value={notifications} tone="yellow" />
          <MetricCard label="Contratos ativos" value={contractsInProgress} tone="indigo" />
          <MetricCard label="Contratos concluídos" value={contractsCompleted} tone="white" />
        </section>

        <SectionShell
          tone="tint"
          eyebrow="Resumo rápido"
          title="Sua jornada na Cuidou"
          description="Mantenha perfil e agenda atualizados para melhorar seu matching com novas vagas."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <article className="theme-list-card">
              <h2 className="text-xl font-display text-[var(--theme-navy)]">Perfil completo</h2>
              <p className="mt-2 text-sm text-[var(--theme-body)]">
                Complete bio, especialidades e localização para maior visibilidade.
              </p>
            </article>
            <article className="theme-list-card">
              <h2 className="text-xl font-display text-[var(--theme-navy)]">Agenda por turnos</h2>
              <p className="mt-2 text-sm text-[var(--theme-body)]">
                Defina dias e turnos disponíveis com exceções por data.
              </p>
            </article>
            <article className="theme-list-card">
              <h2 className="text-xl font-display text-[var(--theme-navy)]">Reputação</h2>
              <p className="mt-2 text-sm text-[var(--theme-body)]">
                Avaliações pós-contratação fortalecem confiança para próximas vagas.
              </p>
            </article>
          </div>
        </SectionShell>
      </div>
    </main>
  );
}
