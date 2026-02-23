import { auth } from "@/auth";
import { AppShell } from "@/components/theme/app-shell";
import { AppIcon } from "@/components/theme/app-icon";
import { CtaButton } from "@/components/theme/cta-button";
import { DataCard } from "@/components/theme/data-card";
import { PageHeader } from "@/components/theme/page-header";
import { SectionShell } from "@/components/theme/section-shell";
import { StatusBadge } from "@/components/theme/status-badge";
import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  LayoutDashboard,
  MessageCircleMore,
  Search,
  UserRoundSearch,
} from "lucide-react";
import Link from "next/link";
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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function applicationStatusTone(status: ApplicationStatus) {
  if (status === ApplicationStatus.ACCEPTED) {
    return "success" as const;
  }

  if (status === ApplicationStatus.REJECTED) {
    return "danger" as const;
  }

  if (status === ApplicationStatus.SHORTLISTED || status === ApplicationStatus.SUBMITTED) {
    return "warning" as const;
  }

  return "neutral" as const;
}

function serviceTypeLabel(value: "BABYSITTER" | "ELDER_CAREGIVER") {
  return value === "BABYSITTER" ? "Babá" : "Cuidadora de idosos";
}

type FamilyApplicationPreview = {
  id: string;
  status: ApplicationStatus;
  createdAt: Date;
  job: {
    title: string;
  };
  professional: {
    name: string | null;
    email: string | null;
  };
};

function FamilyApplicationsPreview({ items }: { items: FamilyApplicationPreview[] }) {
  return (
    <section id="candidaturas-recebidas" className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="theme-chip theme-chip-indigo w-fit">Candidaturas recebidas</p>
          <h2 className="mt-3 text-3xl">Últimas candidaturas</h2>
          <p className="mt-2 text-sm text-[var(--theme-body)]">
            Decida no pipeline completo na área da família para avançar em contratação e contrato.
          </p>
        </div>
        <CtaButton href="/family#pipeline-candidaturas" variant="outline" size="sm" icon={LayoutDashboard}>
          Abrir pipeline completo
        </CtaButton>
      </div>

      {items.length === 0 ? (
        <p className="theme-card-soft mt-5 rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
          Ainda não há candidaturas recebidas para suas vagas.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {items.map((application) => (
            <li key={application.id} className="theme-list-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={applicationStatusTone(application.status)}>{application.status}</StatusBadge>
                <StatusBadge tone="neutral">{formatDate(application.createdAt)}</StatusBadge>
              </div>
              <h3 className="mt-3 text-xl leading-tight">{application.job.title}</h3>
              <p className="mt-2 text-sm text-[var(--theme-body)]">
                Profissional: {application.professional.name ?? application.professional.email ?? "Sem identificação"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type ProfessionalApplicationPreview = {
  id: string;
  status: ApplicationStatus;
  createdAt: Date;
  job: {
    id: string;
    title: string;
    city: string;
    state: string;
    family: {
      name: string | null;
    };
  };
};

function ProfessionalApplicationsPreview({ items }: { items: ProfessionalApplicationPreview[] }) {
  return (
    <section id="candidaturas-recentes" className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="theme-chip theme-chip-indigo w-fit">Minhas candidaturas</p>
          <h2 className="mt-3 text-3xl">Candidaturas recentes</h2>
          <p className="mt-2 text-sm text-[var(--theme-body)]">
            Acompanhe rapidamente em quais vagas você já se candidatou e qual o status atual.
          </p>
        </div>
        <CtaButton href="/professional" variant="outline" size="sm" icon={LayoutDashboard}>
          Ver área profissional
        </CtaButton>
      </div>

      {items.length === 0 ? (
        <p className="theme-card-soft mt-5 rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
          Você ainda não enviou candidaturas.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {items.map((application) => (
            <li key={application.id} className="theme-list-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={applicationStatusTone(application.status)}>{application.status}</StatusBadge>
                <StatusBadge tone="blue">
                  {application.job.city}/{application.job.state}
                </StatusBadge>
              </div>
              <h3 className="mt-3 text-xl leading-tight">{application.job.title}</h3>
              <p className="mt-2 text-sm text-[var(--theme-body)]">
                Família: {application.job.family.name ?? "Família"}
              </p>
              <p className="mt-1 text-xs text-[var(--theme-muted)]">Enviada em {formatDate(application.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type OpenJobPreview = {
  id: string;
  title: string;
  city: string;
  state: string;
  serviceType: "BABYSITTER" | "ELDER_CAREGIVER";
  _count: {
    applications: number;
  };
};

function RecentOpenJobs({ items }: { items: OpenJobPreview[] }) {
  return (
    <section className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="theme-chip theme-chip-blue w-fit">Marketplace</p>
          <h2 className="mt-3 text-3xl">Últimas vagas abertas</h2>
          <p className="mt-2 text-sm text-[var(--theme-body)]">
            Confira 4 oportunidades recentes e avance para a listagem completa quando quiser.
          </p>
        </div>
        <CtaButton href="/marketplace/jobs" variant="outline" size="sm" icon={Search}>
          Ver todas as vagas
        </CtaButton>
      </div>

      {items.length === 0 ? (
        <p className="theme-card-soft mt-5 rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
          Nenhuma vaga aberta no momento.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {items.map((job) => (
            <li key={job.id} className="theme-list-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="info">{serviceTypeLabel(job.serviceType)}</StatusBadge>
                <StatusBadge tone="blue">
                  {job.city}/{job.state}
                </StatusBadge>
                <StatusBadge tone="neutral">{job._count.applications} candidatura(s)</StatusBadge>
              </div>
              <h3 className="mt-3 text-xl leading-tight">{job.title}</h3>
              <Link
                href={`/marketplace/jobs/${job.id}`}
                className="mt-3 inline-flex text-sm font-medium text-[var(--theme-indigo)] underline decoration-[1.5px] underline-offset-3"
              >
                Ver detalhes da vaga
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
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
    const [
      jobs,
      conversations,
      notifications,
      contractsInProgress,
      contractsCompleted,
      receivedApplicationsCount,
      pendingApplicationsCount,
      recentReceivedApplications,
    ] = await Promise.all([
      prisma.jobPost.count({ where: { familyId: session.user.id } }),
      prisma.conversation.count({ where: { familyId: session.user.id } }),
      prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
      prisma.contract.count({
        where: { familyId: session.user.id, status: "IN_PROGRESS" },
      }),
      prisma.contract.count({
        where: { familyId: session.user.id, status: "COMPLETED" },
      }),
      prisma.jobApplication.count({
        where: {
          job: {
            familyId: session.user.id,
          },
        },
      }),
      prisma.jobApplication.count({
        where: {
          job: {
            familyId: session.user.id,
          },
          status: {
            in: [ApplicationStatus.SUBMITTED, ApplicationStatus.SHORTLISTED],
          },
        },
      }),
      prisma.jobApplication.findMany({
        where: {
          job: {
            familyId: session.user.id,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          status: true,
          createdAt: true,
          job: {
            select: {
              title: true,
            },
          },
          professional: {
            select: {
              name: true,
              email: true,
            },
          },
        },
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

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          <DataCard label="Vagas criadas" value={jobs} tone="tint" />
          <DataCard label="Candidaturas recebidas" value={receivedApplicationsCount} tone="surface" href="#candidaturas-recebidas" />
          <DataCard label="Pendentes de decisão" value={pendingApplicationsCount} tone="surface" href="#candidaturas-recebidas" />
          <DataCard label="Conversas" value={conversations} tone="surface" />
          <DataCard label="Notificações não lidas" value={notifications} tone="surface" />
          <DataCard label="Contratos ativos" value={contractsInProgress} tone="deep" />
          <DataCard label="Contratos concluídos" value={contractsCompleted} tone="surface" />
        </section>

        <FamilyQuickActions />

        <FamilyApplicationsPreview items={recentReceivedApplications} />
      </AppShell>
    );
  }

  const [
    applications,
    conversations,
    notifications,
    contractsInProgress,
    contractsCompleted,
    recentApplications,
    recentOpenJobs,
  ] = await Promise.all([
    prisma.jobApplication.count({ where: { professionalId: session.user.id } }),
    prisma.conversation.count({ where: { professionalId: session.user.id } }),
    prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
    prisma.contract.count({
      where: { professionalId: session.user.id, status: "IN_PROGRESS" },
    }),
    prisma.contract.count({
      where: { professionalId: session.user.id, status: "COMPLETED" },
    }),
    prisma.jobApplication.findMany({
      where: { professionalId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        status: true,
        createdAt: true,
        job: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            family: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.jobPost.findMany({
      where: {
        status: "OPEN",
        isVisible: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 4,
      select: {
        id: true,
        title: true,
        city: true,
        state: true,
        serviceType: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
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
        <DataCard label="Candidaturas" value={applications} tone="tint" href="#candidaturas-recentes" />
        <DataCard label="Conversas" value={conversations} tone="surface" />
        <DataCard label="Notificações não lidas" value={notifications} tone="surface" />
        <DataCard label="Contratos ativos" value={contractsInProgress} tone="deep" />
        <DataCard label="Contratos concluídos" value={contractsCompleted} tone="surface" />
      </section>

      <ProfessionalQuickActions />

      <ProfessionalApplicationsPreview items={recentApplications} />

      <RecentOpenJobs items={recentOpenJobs} />
    </AppShell>
  );
}
