import { auth } from "@/auth";
import { AppShell } from "@/components/theme/app-shell";
import { CtaButton } from "@/components/theme/cta-button";
import { EmptyState } from "@/components/theme/empty-state";
import { PageHeader } from "@/components/theme/page-header";
import { StatusBadge } from "@/components/theme/status-badge";
import { expirePendingInvitationsWithNotifications } from "@/lib/invitations";
import { buildScheduleSummary, getScheduleMatchLevel } from "@/lib/job-schedule";
import { prisma } from "@/lib/prisma";
import { LayoutDashboard, Search } from "lucide-react";
import { redirect } from "next/navigation";
import { AvailabilityManager } from "./availability-manager";
import { ProfessionalContractsPanel } from "./contracts-panel";
import { DocumentsPanel } from "./documents-panel";
import { ProfessionalInvitationsPanel } from "./invitations-panel";
import { ProfessionalProfileForm } from "./profile-form";
import { WithdrawApplicationButton } from "./withdraw-application-button";

export const dynamic = "force-dynamic";

export default async function ProfessionalAreaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "PROFESSIONAL") {
    redirect("/dashboard");
  }

  await expirePendingInvitationsWithNotifications({ professionalId: session.user.id });

  const [profile, applications, invitations, contracts, reviewsReceived, reviewsAggregate] = await Promise.all([
    prisma.professionalProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        documents: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
        availabilitySlots: {
          orderBy: [{ weekday: "asc" }, { shift: "asc" }],
        },
        availabilityExceptions: {
          orderBy: [{ date: "asc" }, { shift: "asc" }],
        },
        user: {
          select: {
            phone: true,
          },
        },
      },
    }),
    prisma.jobApplication.findMany({
      where: { professionalId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
          },
        },
      },
      take: 20,
    }),
    prisma.jobInvitation.findMany({
      where: { professionalId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            serviceType: true,
            status: true,
            scheduleSlots: {
              select: {
                weekday: true,
                startTime: true,
                endTime: true,
              },
              orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
            },
          },
        },
        family: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 30,
    }),
    prisma.contract.findMany({
      where: {
        professionalId: session.user.id,
      },
      include: {
        job: {
          select: {
            title: true,
          },
        },
        family: {
          select: {
            name: true,
          },
        },
        application: {
          select: {
            id: true,
            reviews: {
              where: {
                reviewerId: session.user.id,
              },
              select: {
                id: true,
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
    }),
    prisma.review.findMany({
      where: { revieweeId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        reviewer: { select: { id: true, name: true } },
      },
    }),
    prisma.review.aggregate({
      where: { revieweeId: session.user.id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  return (
    <AppShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Dashboard", href: "/dashboard" },
        { label: "Profissional" },
      ]}
    >
      <PageHeader
        eyebrow="Área profissional"
        title="Mantenha perfil e agenda sempre atualizados"
        description="Gerencie verificações, candidaturas enviadas e disponibilidade semanal para novas oportunidades."
        actions={
          <>
            <CtaButton href="/dashboard" variant="outline" icon={LayoutDashboard}>
              Voltar ao dashboard
            </CtaButton>
            <CtaButton href="/marketplace/jobs" icon={Search}>
              Buscar vagas
            </CtaButton>
          </>
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        <article className="theme-card-soft rounded-3xl px-5 py-5">
          <p className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Verificação</p>
          <div className="mt-2">
            <StatusBadge
              tone={
                profile?.verificationStatus === "VERIFIED"
                  ? "success"
                  : profile?.verificationStatus === "REJECTED"
                    ? "danger"
                    : "warning"
              }
            >
              {profile?.verificationStatus ?? "NOT_SUBMITTED"}
            </StatusBadge>
          </div>
        </article>

        <article className="theme-card-soft rounded-3xl px-5 py-5">
          <p className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Localização</p>
          <p className="mt-2 text-2xl">
            {profile?.city ?? "-"} / {profile?.state ?? "-"}
          </p>
        </article>

        <article className="theme-card-soft rounded-3xl px-5 py-5">
          <p className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Especialidades</p>
          <p className="mt-2 text-2xl">{profile?.serviceTypes.join(", ") || "Não definidas"}</p>
        </article>
      </section>

      <section id="perfil-profissional" className="theme-card rounded-[34px] px-6 py-8 sm:px-8">
        <p className="theme-chip theme-chip-yellow w-fit">Perfil profissional</p>
        <h2 className="mt-3 text-3xl">Edicao de dados e servicos</h2>
        <p className="mt-2 text-sm text-[var(--theme-body)]">
          Atualize seu perfil para melhorar compatibilidade com vagas e convites.
        </p>
        <div className="mt-5">
          <ProfessionalProfileForm
            initialValue={{
              bio: profile?.bio ?? "",
              experienceYears: profile?.experienceYears ?? null,
              serviceTypes: profile?.serviceTypes ?? [],
              availability: profile?.availability ?? "",
              state: profile?.state ?? "",
              city: profile?.city ?? "",
              neighborhood: profile?.neighborhood ?? "",
              hourlyRateMin: profile?.hourlyRateMin ?? null,
              hourlyRateMax: profile?.hourlyRateMax ?? null,
              phone: profile?.user.phone ?? "",
            }}
          />
        </div>
      </section>

      <DocumentsPanel
        initialVerificationStatus={profile?.verificationStatus ?? "NOT_SUBMITTED"}
        initialDocuments={
          profile?.documents.map((document) => ({
            id: document.id,
            documentType: document.documentType,
            fileUrl: document.fileUrl,
            status: document.status,
            rejectionReason: document.rejectionReason,
            reviewedAt: document.reviewedAt?.toISOString() ?? null,
            createdAt: document.createdAt.toISOString(),
          })) ?? []
        }
      />

      <AvailabilityManager
        initialWeeklySlots={
          profile?.availabilitySlots.map((slot) => ({
            weekday: slot.weekday,
            shift: slot.shift,
            isAvailable: slot.isAvailable,
          })) ?? []
        }
        initialExceptions={
          profile?.availabilityExceptions.map((item) => ({
            date: item.date.toISOString().slice(0, 10),
            shift: item.shift,
            isAvailable: item.isAvailable,
            note: item.note,
          })) ?? []
        }
        legacyAvailabilityText={profile?.availability}
      />

      <ProfessionalInvitationsPanel
        initialInvitations={invitations.map((invitation) => ({
          ...invitation,
          createdAt: invitation.createdAt.toISOString(),
          expiresAt: invitation.expiresAt.toISOString(),
          scheduleSummary: buildScheduleSummary(invitation.job.scheduleSlots),
          compatibility: getScheduleMatchLevel(
            invitation.job.scheduleSlots,
            profile?.availabilitySlots ?? [],
          ),
        }))}
      />

      <ProfessionalContractsPanel
        initialContracts={contracts.map((contract) => ({
          id: contract.id,
          applicationId: contract.application.id,
          status: contract.status,
          startedAt: contract.startedAt.toISOString(),
          completedAt: contract.completedAt?.toISOString() ?? null,
          canceledAt: contract.canceledAt?.toISOString() ?? null,
          cancelReason: contract.cancelReason ?? null,
          hasReviewedByCurrentUser: contract.application.reviews.length > 0,
          job: {
            title: contract.job.title,
          },
          family: {
            name: contract.family.name,
          },
        }))}
      />

      <section className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
        <p className="theme-chip theme-chip-blue w-fit">Candidaturas</p>
        <h2 className="mt-3 text-3xl">Candidaturas enviadas</h2>
        <p className="mt-2 text-sm text-[var(--theme-body)]">
          Acompanhe status e contexto das vagas onde você demonstrou interesse.
        </p>

        {applications.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="Nenhuma candidatura enviada"
              description="Explore vagas abertas no marketplace e envie sua primeira candidatura com mensagem inicial."
              action={
                <CtaButton href="/marketplace/jobs" icon={Search}>
                  Buscar vagas agora
                </CtaButton>
              }
              icon="candidatura"
            />
          </div>
        ) : (
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {applications.map((application) => (
              <li key={application.id} className="theme-list-card p-5">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone="blue">
                    {application.job.city}/{application.job.state}
                  </StatusBadge>
                  <StatusBadge tone="warning">{application.status}</StatusBadge>
                </div>

                <h3 className="mt-3 text-2xl leading-tight">{application.job.title}</h3>
                {application.status === "SUBMITTED" || application.status === "SHORTLISTED" ? (
                  <WithdrawApplicationButton applicationId={application.id} />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {reviewsReceived.length > 0 ? (
        <section className="theme-card rounded-[34px] px-5 py-6 sm:px-7 sm:py-7">
          <p className="theme-chip theme-chip-yellow w-fit">Reputação</p>
          <h2 className="mt-3 text-3xl">Minhas avaliações</h2>
          <p className="mt-1 text-sm text-[var(--theme-muted)]">
            {reviewsAggregate._count.rating} avaliação(ões) recebida(s) •{" "}
            {reviewsAggregate._avg.rating
              ? `média ${reviewsAggregate._avg.rating.toFixed(1)}/5`
              : "sem média ainda"}
          </p>
          <ul className="mt-5 space-y-3">
            {reviewsReceived.map((review) => (
              <li key={review.id} className="theme-list-card p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-[var(--theme-navy)]">
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  </span>
                  <span className="text-sm text-[var(--theme-muted)]">
                    por {review.reviewer.name ?? "Usuário"} •{" "}
                    {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                {review.comment ? (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--theme-body)]">{review.comment}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AppShell>
  );
}
