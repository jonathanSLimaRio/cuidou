import { auth } from "@/auth";
import { AppShell } from "@/components/theme/app-shell";
import { AppIcon } from "@/components/theme/app-icon";
import { CtaButton } from "@/components/theme/cta-button";
import { DataCard } from "@/components/theme/data-card";
import { PageHeader } from "@/components/theme/page-header";
import { SectionShell } from "@/components/theme/section-shell";
import { prisma } from "@/lib/prisma";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  LayoutDashboard,
  MessageCircleMore,
  Search,
  UserRoundSearch,
} from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function FamilyQuickActions() {
  return (
    <SectionShell
      tone="tint"
      eyebrow="Próximas ações"
      title="Fluxo da família"
      description="Priorize as próximas decisões para acelerar a contratação sem perder qualidade."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <article className="theme-list-card">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--theme-pink)]/50 text-[var(--theme-indigo-strong)]">
            <AppIcon icon={BriefcaseBusiness} size="md" />
          </span>
          <h2 className="text-xl">Publicação de vagas</h2>
          <p className="mt-2 text-sm text-[var(--theme-body)]">
            Crie vagas claras com localização e faixa de valor para receber candidaturas mais aderentes.
          </p>
        </article>
        <article className="theme-list-card">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--theme-sky)]/45 text-[var(--theme-indigo-strong)]">
            <AppIcon icon={UserRoundSearch} size="md" />
          </span>
          <h2 className="text-xl">Triagem e aceite</h2>
          <p className="mt-2 text-sm text-[var(--theme-body)]">
            Avalie candidaturas em lote e aceite o perfil ideal para iniciar contrato e chat protegido.
          </p>
        </article>
        <article className="theme-list-card">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--theme-yellow)]/45 text-[var(--theme-indigo-strong)]">
            <AppIcon icon={BadgeCheck} size="md" />
          </span>
          <h2 className="text-xl">Encerrar e avaliar</h2>
          <p className="mt-2 text-sm text-[var(--theme-body)]">
            Conclua contratos, registre feedback e fortaleça sua reputação na plataforma.
          </p>
        </article>
      </div>
    </SectionShell>
  );
}

function ProfessionalQuickActions() {
  return (
    <SectionShell
      tone="tint"
      eyebrow="Próximas ações"
      title="Jornada do profissional"
      description="Mantenha seu perfil competitivo e aumente taxa de resposta das candidaturas."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <article className="theme-list-card">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--theme-sky)]/45 text-[var(--theme-indigo-strong)]">
            <AppIcon icon={BadgeCheck} size="md" />
          </span>
          <h2 className="text-xl">Perfil completo</h2>
          <p className="mt-2 text-sm text-[var(--theme-body)]">
            Atualize bio, especialidades e documentação para melhorar sua visibilidade no marketplace.
          </p>
        </article>
        <article className="theme-list-card">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--theme-yellow)]/45 text-[var(--theme-indigo-strong)]">
            <AppIcon icon={CalendarClock} size="md" />
          </span>
          <h2 className="text-xl">Agenda por turnos</h2>
          <p className="mt-2 text-sm text-[var(--theme-body)]">
            Organize disponibilidade semanal e exceções para evitar conflitos de contratação.
          </p>
        </article>
        <article className="theme-list-card">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--theme-pink)]/50 text-[var(--theme-indigo-strong)]">
            <AppIcon icon={MessageCircleMore} size="md" />
          </span>
          <h2 className="text-xl">Follow-up no chat</h2>
          <p className="mt-2 text-sm text-[var(--theme-body)]">
            Responda rapidamente no chat após aceite para aumentar confiança e conversão.
          </p>
        </article>
      </div>
    </SectionShell>
  );
}

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
      <AppShell>
        <PageHeader
          eyebrow="Dashboard"
          title="Painel da família"
          description="Acompanhe vagas, candidaturas, contratos e mensagens em um único espaço de operação diária."
          actions={
            <>
              <CtaButton href="/family" icon={LayoutDashboard}>
                Ir para área da família
              </CtaButton>
              <CtaButton href="/marketplace/jobs" variant="outline" icon={Search}>
                Ver marketplace
              </CtaButton>
              <CtaButton href="/chat" variant="soft" icon={MessageCircleMore}>
                Abrir chat
              </CtaButton>
            </>
          }
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <DataCard label="Vagas criadas" value={jobs} tone="tint" />
          <DataCard label="Conversas" value={conversations} tone="surface" />
          <DataCard label="Notificações não lidas" value={notifications} tone="surface" />
          <DataCard label="Contratos ativos" value={contractsInProgress} tone="deep" />
          <DataCard label="Contratos concluídos" value={contractsCompleted} tone="surface" />
        </section>

        <FamilyQuickActions />
      </AppShell>
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
    <AppShell>
      <PageHeader
        eyebrow="Dashboard"
        title="Painel do profissional"
        description="Visualize oportunidades, candidaturas enviadas, contratos ativos e conversas em andamento."
        actions={
          <>
            <CtaButton href="/professional" icon={LayoutDashboard}>
              Ir para área profissional
            </CtaButton>
            <CtaButton href="/marketplace/jobs" variant="outline" icon={Search}>
              Buscar vagas
            </CtaButton>
            <CtaButton href="/chat" variant="soft" icon={MessageCircleMore}>
              Abrir chat
            </CtaButton>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <DataCard label="Candidaturas" value={applications} tone="tint" />
        <DataCard label="Conversas" value={conversations} tone="surface" />
        <DataCard label="Notificações não lidas" value={notifications} tone="surface" />
        <DataCard label="Contratos ativos" value={contractsInProgress} tone="deep" />
        <DataCard label="Contratos concluídos" value={contractsCompleted} tone="surface" />
      </section>

      <ProfessionalQuickActions />
    </AppShell>
  );
}
