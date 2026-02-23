import { auth } from "@/auth";
import { AppShell } from "@/components/theme/app-shell";
import { CtaButton } from "@/components/theme/cta-button";
import { DataTableShell } from "@/components/theme/data-table-shell";
import { PageHeader } from "@/components/theme/page-header";
import { StatusBadge } from "@/components/theme/status-badge";
import { getScheduleMatchLevel, WEEKDAY_LABEL } from "@/lib/job-schedule";
import { prisma } from "@/lib/prisma";
import { LayoutDashboard, LogIn, UserRoundSearch } from "lucide-react";
import { notFound } from "next/navigation";
import { ApplyToJobForm } from "./apply-to-job-form";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

function serviceTypeLabel(value: "BABYSITTER" | "ELDER_CAREGIVER") {
  return value === "BABYSITTER" ? "Babá" : "Cuidadora de idosos";
}

export default async function MarketplaceJobDetailPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();

  const job = await prisma.jobPost.findUnique({
    where: { id },
    include: {
      family: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
      scheduleSlots: {
        orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!job) {
    notFound();
  }

  const canAccessPrivate =
    session?.user &&
    (session.user.role === "ADMIN" ||
      (session.user.role === "FAMILY" && session.user.id === job.familyId));

  if (!job.isVisible && !canAccessPrivate) {
    notFound();
  }

  let alreadyApplied = false;
  let precheckWarning: string | null = null;
  if (session?.user?.role === "PROFESSIONAL") {
    const [existing, professionalProfile] = await Promise.all([
      prisma.jobApplication.findUnique({
        where: {
          jobId_professionalId: {
            jobId: job.id,
            professionalId: session.user.id,
          },
        },
        select: { id: true },
      }),
      prisma.professionalProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          availabilitySlots: {
            select: {
              weekday: true,
              shift: true,
              isAvailable: true,
            },
          },
        },
      }),
    ]);

    alreadyApplied = Boolean(existing);

    const match = getScheduleMatchLevel(job.scheduleSlots, professionalProfile?.availabilitySlots ?? []);
    if (match.level !== "HIGH") {
      precheckWarning = match.description;
    }
  }

  const loginHref = `/login?next=${encodeURIComponent(`/marketplace/jobs/${job.id}`)}`;

  return (
    <AppShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Vagas", href: "/marketplace/jobs" },
        { label: "Detalhe" },
      ]}
    >
      <PageHeader
        eyebrow="Detalhe da vaga"
        title={job.title}
        description={`Publicada por ${job.family.name ?? "Família"} em ${job.city}/${job.state}.`}
        actions={
          <>
            <StatusBadge tone="blue">{serviceTypeLabel(job.serviceType)}</StatusBadge>
            <StatusBadge tone={job.status === "OPEN" ? "success" : "warning"}>
              {job.status}
            </StatusBadge>
            <StatusBadge tone="neutral">{job._count.applications} candidaturas</StatusBadge>
          </>
        }
      />

      <section className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="yellow">
            {job.city}/{job.state}
          </StatusBadge>
          <StatusBadge tone="info">Família: {job.family.name ?? "Anônimo"}</StatusBadge>
        </div>

        <h2 className="mt-4 text-3xl">Descrição</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--theme-body)]">
          {job.description}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="theme-card-soft rounded-2xl px-4 py-3">
            <p className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Faixa de valor</p>
            <p className="mt-2 text-lg text-[var(--theme-navy)]">
              {job.hourlyRateMin ? `R$ ${job.hourlyRateMin}` : "-"}
              {job.hourlyRateMax ? ` até R$ ${job.hourlyRateMax}` : ""}
            </p>
          </div>
          <div className="theme-card-soft rounded-2xl px-4 py-3">
            <p className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Publicado em</p>
            <p className="mt-2 text-lg text-[var(--theme-navy)]">
              {new Date(job.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>

        {job.scheduleSlots.length > 0 ? (
          <div className="mt-5">
            <DataTableShell
              title="Agenda da vaga"
              description="Dias e horários recorrentes definidos pela família."
            >
              <div className="theme-table-wrap">
                <table className="theme-table">
                  <thead>
                    <tr>
                      <th>Dia</th>
                      <th>Início</th>
                      <th>Fim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.scheduleSlots.map((slot) => (
                      <tr key={`${slot.weekday}-${slot.startTime}-${slot.endTime}`}>
                        <td>{WEEKDAY_LABEL[slot.weekday]}</td>
                        <td>{slot.startTime}</td>
                        <td>{slot.endTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DataTableShell>
          </div>
        ) : null}

        {job.scheduleDetails ? (
          <div className="mt-5">
            <DataTableShell
              title={job.scheduleSlots.length > 0 ? "Observações adicionais de agenda" : "Detalhes de agenda"}
              description={
                job.scheduleSlots.length > 0
                  ? "Informações complementares fornecidas pela família."
                  : "Informações adicionais fornecidas pela família para organização dos turnos."
              }
            >
              <p className="text-sm text-[var(--theme-body)]">{job.scheduleDetails}</p>
            </DataTableShell>
          </div>
        ) : null}
      </section>

      <section className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
        <p className="theme-chip theme-chip-blue w-fit">Ações</p>
        <h2 className="mt-3 text-3xl">Próximo passo</h2>

        <div className="mt-4">
          {!session?.user ? (
            <CtaButton href={loginHref} icon={LogIn}>
              Entrar para se candidatar
            </CtaButton>
          ) : null}

          {session?.user?.role === "PROFESSIONAL" ? (
            job.status === "OPEN" ? (
              <ApplyToJobForm
                jobId={job.id}
                alreadyApplied={alreadyApplied}
                precheckWarning={precheckWarning}
              />
            ) : (
              <p className="theme-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
                Esta vaga não está aberta para novas candidaturas no momento.
              </p>
            )
          ) : null}

          {session?.user?.role === "FAMILY" && session.user.id === job.familyId ? (
            <CtaButton href="/family" variant="outline" icon={LayoutDashboard}>
              Gerenciar na área da família
            </CtaButton>
          ) : null}

          {session?.user?.role === "FAMILY" && session.user.id !== job.familyId ? (
            <CtaButton href="/marketplace/professionals" variant="outline" icon={UserRoundSearch}>
              Ver profissionais para convidar
            </CtaButton>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
