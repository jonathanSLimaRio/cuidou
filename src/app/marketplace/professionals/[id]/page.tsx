import { auth } from "@/auth";
import { AppShell } from "@/components/theme/app-shell";
import { CtaButton } from "@/components/theme/cta-button";
import { PageHeader } from "@/components/theme/page-header";
import { ReportAction } from "@/components/reports/report-action";
import { StatusBadge } from "@/components/theme/status-badge";
import { getScheduleMatchLevel } from "@/lib/job-schedule";
import { prisma } from "@/lib/prisma";
import { LayoutDashboard, LogIn, Search } from "lucide-react";
import { notFound } from "next/navigation";
import { InviteToJobForm } from "./invite-to-job-form";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const weekdayLabel = {
  MONDAY: "Segunda",
  TUESDAY: "Terça",
  WEDNESDAY: "Quarta",
  THURSDAY: "Quinta",
  FRIDAY: "Sexta",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
} as const;

const shiftLabel = {
  MORNING: "Manhã",
  AFTERNOON: "Tarde",
  EVENING: "Noite",
  OVERNIGHT: "Madrugada",
} as const;

function serviceTypeLabel(value: "BABYSITTER" | "ELDER_CAREGIVER") {
  return value === "BABYSITTER" ? "Babá" : "Cuidadora de idosos";
}

export default async function MarketplaceProfessionalDetailPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();

  const professional = await prisma.professionalProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      availabilitySlots: {
        where: { isAvailable: true },
        orderBy: [{ weekday: "asc" }, { shift: "asc" }],
      },
      availabilityExceptions: {
        orderBy: [{ date: "asc" }, { shift: "asc" }],
        take: 10,
      },
    },
  });

  if (!professional) {
    notFound();
  }

  const reputation = await prisma.review.aggregate({
    where: {
      revieweeId: professional.userId,
    },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });

  const familyOpenJobs =
    session?.user?.role === "FAMILY"
      ? await prisma.jobPost.findMany({
          where: {
            familyId: session.user.id,
            status: "OPEN",
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            _count: {
              select: {
                applications: true,
              },
            },
            scheduleSlots: {
              select: {
                weekday: true,
                startTime: true,
                endTime: true,
              },
            },
          },
          take: 20,
        })
      : [];

  const availabilityByDay = professional.availabilitySlots.reduce<Record<string, string[]>>(
    (acc, slot) => {
      const day = weekdayLabel[slot.weekday];
      if (!acc[day]) {
        acc[day] = [];
      }

      acc[day].push(shiftLabel[slot.shift]);
      return acc;
    },
    {},
  );

  const loginHref = `/login?next=${encodeURIComponent(`/marketplace/professionals/${professional.id}`)}`;

  return (
    <AppShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Profissionais", href: "/marketplace/professionals" },
        { label: "Detalhe" },
      ]}
    >
      <PageHeader
        eyebrow="Perfil profissional"
        title={professional.user.name ?? "Profissional"}
        description={`Atuação em ${professional.city ?? "-"}/${professional.state ?? "-"}`}
        actions={
          <>
            <StatusBadge
              tone={professional.verificationStatus === "VERIFIED" ? "success" : "warning"}
            >
              {professional.verificationStatus}
            </StatusBadge>
            <StatusBadge tone="neutral">
              {reputation._avg.rating ? reputation._avg.rating.toFixed(1) : "-"} (
              {reputation._count.rating} avaliações)
            </StatusBadge>
          </>
        }
      />

      <section className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="yellow">
            {professional.city ?? "-"}/{professional.state ?? "-"}
          </StatusBadge>
          {professional.serviceTypes.map((serviceType) => (
            <StatusBadge key={serviceType} tone="info">
              {serviceTypeLabel(serviceType)}
            </StatusBadge>
          ))}
          {professional.verificationStatus === "VERIFIED" ? (
            <StatusBadge tone="success">Verificado</StatusBadge>
          ) : null}
        </div>

        <h2 className="mt-4 text-3xl">Sobre</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--theme-body)]">
          {professional.bio ??
            "Profissional de cuidado com perfil ativo no marketplace da Cuidou."}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="theme-card-soft rounded-2xl px-4 py-3">
            <p className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Experiência</p>
            <p className="mt-2 text-lg text-[var(--theme-navy)]">
              {professional.experienceYears ?? 0} anos
            </p>
          </div>
          <div className="theme-card-soft rounded-2xl px-4 py-3">
            <p className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Faixa por hora</p>
            <p className="mt-2 text-lg text-[var(--theme-navy)]">
              {professional.hourlyRateMin ? `R$ ${professional.hourlyRateMin}` : "-"}
              {professional.hourlyRateMax ? ` até R$ ${professional.hourlyRateMax}` : ""}
            </p>
          </div>
        </div>
      </section>

      <section className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
        <p className="theme-chip theme-chip-blue w-fit">Disponibilidade</p>
        <h2 className="mt-3 text-3xl">Agenda semanal</h2>

        {Object.keys(availabilityByDay).length === 0 ? (
          <p className="mt-3 text-sm text-[var(--theme-muted)]">Sem turnos disponíveis cadastrados.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(availabilityByDay).map(([day, shifts]) => (
              <li key={day} className="theme-list-card p-4">
                <p className="font-display text-lg text-[var(--theme-navy)]">{day}</p>
                <p className="mt-1 text-sm text-[var(--theme-body)]">{shifts.join(", ")}</p>
              </li>
            ))}
          </ul>
        )}

        {professional.availabilityExceptions.length > 0 ? (
          <div className="mt-5">
            <h3 className="text-2xl">Próximas exceções</h3>
            <ul className="mt-3 space-y-2">
              {professional.availabilityExceptions.map((item) => (
                <li key={item.id} className="theme-card-soft rounded-2xl px-4 py-3 text-sm">
                  {new Date(item.date).toLocaleDateString("pt-BR")} - {shiftLabel[item.shift]} -{" "}
                  {item.isAvailable ? "Disponível" : "Indisponível"}
                  {item.note ? ` (${item.note})` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
        <p className="theme-chip theme-chip-pink w-fit">Ação recomendada</p>
        <h2 className="mt-3 text-3xl">Próximo passo</h2>
        <div className="mt-4">
          {!session?.user ? (
            <CtaButton href={loginHref} icon={LogIn}>
              Entrar para contratar
            </CtaButton>
          ) : null}

          {session?.user?.role === "FAMILY" ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--theme-body)]">
                Convide este profissional para uma vaga sua. O convite abre uma candidatura formal.
              </p>
              <InviteToJobForm
                professionalId={professional.userId}
                jobs={familyOpenJobs.map((job) => ({
                  id: job.id,
                  title: job.title,
                  city: job.city,
                  state: job.state,
                  applicationsCount: job._count.applications,
                  compatibility: getScheduleMatchLevel(
                    job.scheduleSlots,
                    professional.availabilitySlots,
                  ),
                }))}
              />
              <CtaButton href="/family" variant="outline" icon={Search}>
                Gerenciar vagas da família
              </CtaButton>
            </div>
          ) : null}

          {session?.user?.role === "PROFESSIONAL" && session.user.id === professional.user.id ? (
            <CtaButton href="/professional" variant="outline" icon={LayoutDashboard}>
              Gerenciar meu perfil
            </CtaButton>
          ) : null}

          {session?.user && session.user.id !== professional.user.id ? (
            <ReportAction
              targetType="PROFESSIONAL_PROFILE"
              targetProfessionalProfileId={professional.id}
              buttonLabel="Denunciar perfil"
            />
          ) : null}

        </div>
      </section>
    </AppShell>
  );
}
