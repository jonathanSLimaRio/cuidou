import { auth } from "@/auth";
import { AppShell } from "@/components/theme/app-shell";
import { CtaButton } from "@/components/theme/cta-button";
import { EmptyState } from "@/components/theme/empty-state";
import { PageHeader } from "@/components/theme/page-header";
import { StatusBadge } from "@/components/theme/status-badge";
import { expirePendingInvitationsWithNotifications } from "@/lib/invitations";
import { prisma } from "@/lib/prisma";
import { JobInvitationStatus } from "@prisma/client";
import { CalendarClock, CalendarPlus, LayoutDashboard, Search, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { FamilyContractsPanel } from "./contracts-panel";
import { InvitationsPanel } from "./invitations-panel";
import { JobForm } from "./job-form";

export const dynamic = "force-dynamic";

function buildInvitationCounters(statusItems: Array<{ status: JobInvitationStatus; _count: { _all: number } }>) {
  const counters: Record<JobInvitationStatus, number> = {
    PENDING: 0,
    ACCEPTED: 0,
    DECLINED: 0,
    EXPIRED: 0,
    CANCELED: 0,
  };

  for (const item of statusItems) {
    counters[item.status] = item._count._all;
  }

  return counters;
}

export default async function FamilyAreaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "FAMILY") {
    redirect("/dashboard");
  }

  await expirePendingInvitationsWithNotifications({ familyId: session.user.id });

  const [profile, jobs, contracts] = await Promise.all([
    prisma.familyProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.jobPost.findMany({
      where: { familyId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        scheduleSlots: {
          orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
        },
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

  const jobIds = jobs.map((job) => job.id);

  const [invitationCounts, invitations] = jobIds.length
    ? await Promise.all([
        prisma.jobInvitation.groupBy({
          by: ["jobId", "status"],
          where: {
            jobId: {
              in: jobIds,
            },
          },
          _count: {
            _all: true,
          },
        }),
        prisma.jobInvitation.findMany({
          where: {
            jobId: {
              in: jobIds,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            professional: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            job: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        }),
      ])
    : [[], []];

  const invitationCountByJob = new Map<string, ReturnType<typeof buildInvitationCounters>>();

  for (const jobId of jobIds) {
    const statusItems = invitationCounts.filter((item) => item.jobId === jobId);
    invitationCountByJob.set(jobId, buildInvitationCounters(statusItems));
  }

  const invitationGroups = jobs
    .map((job) => ({
      jobId: job.id,
      jobTitle: job.title,
      items: invitations
        .filter((invitation) => invitation.jobId === job.id)
        .map((invitation) => ({
          id: invitation.id,
          status: invitation.status,
          message: invitation.message,
          responseMessage: invitation.responseMessage,
          createdAt: invitation.createdAt.toISOString(),
          expiresAt: invitation.expiresAt.toISOString(),
          respondedAt: invitation.respondedAt?.toISOString() ?? null,
          professional: invitation.professional,
        })),
    }))
    .filter((group) => group.items.length > 0);

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
        title="Gerencie contratação com agenda e convites"
        description="Crie vagas com dia/hora obrigatório, acompanhe candidaturas e convide profissionais para se candidatarem."
        actions={
          <>
            <CtaButton href="/dashboard" variant="outline" icon={LayoutDashboard}>
              Voltar ao dashboard
            </CtaButton>
            <CtaButton href="/marketplace/professionals" icon={Search}>
              Buscar profissionais
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
        <p className="theme-chip theme-chip-blue w-fit">Nova vaga</p>
        <h2 className="mt-3 text-3xl">Publicar vaga com agenda estruturada</h2>
        <p className="mt-2 text-sm text-[var(--theme-body)]">
          Para novas vagas, informe pelo menos um horário recorrente (dia + hora inicial/final).
        </p>

        <div className="mt-5">
          <JobForm mode="create" />
        </div>
      </section>

      <section className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="theme-chip theme-chip-indigo">Vagas</p>
            <h2 className="mt-3 text-3xl">Minhas vagas publicadas</h2>
            <p className="mt-2 text-sm text-[var(--theme-body)]">
              Acompanhe candidaturas, convites e edite agenda por vaga.
            </p>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="Nenhuma vaga criada ainda"
              description="Crie sua primeira vaga para começar a receber candidaturas e enviar convites."
              action={
                <CtaButton href="/marketplace/professionals" icon={Users}>
                  Explorar profissionais
                </CtaButton>
              }
              icon="vagas"
            />
          </div>
        ) : (
          <ul className="mt-5 grid gap-4">
            {jobs.map((job) => {
              const invitationCounters = invitationCountByJob.get(job.id) ?? {
                PENDING: 0,
                ACCEPTED: 0,
                DECLINED: 0,
                EXPIRED: 0,
                CANCELED: 0,
              };

              return (
                <li key={job.id} className="theme-list-card p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone="blue">
                      {job.city}/{job.state}
                    </StatusBadge>
                    <StatusBadge tone={job.status === "OPEN" ? "success" : "warning"}>{job.status}</StatusBadge>
                    <StatusBadge tone="neutral">{job._count.applications} candidatura(s)</StatusBadge>
                    <StatusBadge tone="warning">{invitationCounters.PENDING} convite(s) pendente(s)</StatusBadge>
                    <StatusBadge tone="success">{invitationCounters.ACCEPTED} aceito(s)</StatusBadge>
                    <StatusBadge tone="danger">{invitationCounters.DECLINED} recusado(s)</StatusBadge>
                  </div>

                  <h3 className="mt-3 text-2xl leading-tight">{job.title}</h3>

                  <details className="mt-4 rounded-2xl border border-[var(--theme-border)] bg-white/90 p-4">
                    <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--theme-navy)]">
                      <CalendarClock size={16} />
                      Editar dados e agenda da vaga
                    </summary>
                    <div className="mt-4">
                      <JobForm
                        mode="edit"
                        initialValue={{
                          id: job.id,
                          serviceType: job.serviceType,
                          title: job.title,
                          description: job.description,
                          state: job.state,
                          city: job.city,
                          neighborhood: job.neighborhood,
                          hourlyRateMin: job.hourlyRateMin,
                          hourlyRateMax: job.hourlyRateMax,
                          scheduleDetails: job.scheduleDetails,
                          status: job.status,
                          scheduleSlots:
                            job.scheduleSlots.length > 0
                              ? job.scheduleSlots.map((slot) => ({
                                  weekday: slot.weekday,
                                  startTime: slot.startTime,
                                  endTime: slot.endTime,
                                }))
                              : [
                                  {
                                    weekday: "MONDAY",
                                    startTime: "08:00",
                                    endTime: "12:00",
                                  },
                                ],
                        }}
                      />
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <InvitationsPanel initialGroups={invitationGroups} />

      <FamilyContractsPanel
        initialContracts={contracts.map((contract) => ({
          ...contract,
          createdAt: contract.createdAt.toISOString(),
          startedAt: contract.startedAt.toISOString(),
          completedAt: contract.completedAt?.toISOString() ?? null,
          canceledAt: contract.canceledAt?.toISOString() ?? null,
        }))}
      />

      {jobs.length > 0 ? (
        <section className="theme-card-soft rounded-3xl px-5 py-5">
          <div className="flex items-start gap-3">
            <CalendarPlus className="mt-0.5 text-[var(--brand-purple-primary)]" size={20} />
            <div>
              <h3 className="text-xl">Dica de operação</h3>
              <p className="mt-1 text-sm text-[var(--theme-body)]">
                Para melhorar a taxa de resposta, mantenha ao menos 2 opções de horário por vaga e envie convites
                apenas para profissionais com disponibilidade semelhante.
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
