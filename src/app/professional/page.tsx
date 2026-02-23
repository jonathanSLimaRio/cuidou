import { auth } from "@/auth";
import { CtaButton } from "@/components/theme/cta-button";
import { PageHero } from "@/components/theme/page-hero";
import { SectionShell } from "@/components/theme/section-shell";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AvailabilityManager } from "./availability-manager";

export const dynamic = "force-dynamic";

export default async function ProfessionalAreaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "PROFESSIONAL") {
    redirect("/dashboard");
  }

  const [profile, applications] = await Promise.all([
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
  ]);

  return (
    <main className="theme-page">
      <div className="theme-container space-y-6">
        <PageHero
          eyebrow="Área profissional"
          title="Mantenha perfil e agenda sempre atualizados"
          description="Gerencie verificações, candidaturas enviadas e disponibilidade semanal para novas oportunidades."
          actions={
            <>
              <CtaButton href="/dashboard">Voltar ao dashboard</CtaButton>
              <CtaButton href="/marketplace/jobs" variant="outline">
                Buscar vagas
              </CtaButton>
            </>
          }
        />

        <SectionShell tone="light" eyebrow="Perfil" title="Resumo profissional">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="theme-list-card">
              <p className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Verificação</p>
              <p className="mt-2 text-lg font-display text-[var(--theme-navy)]">
                {profile?.verificationStatus ?? "NOT_SUBMITTED"}
              </p>
            </div>
            <div className="theme-list-card">
              <p className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Localização</p>
              <p className="mt-2 text-lg font-display text-[var(--theme-navy)]">
                {profile?.city ?? "-"} / {profile?.state ?? "-"}
              </p>
            </div>
            <div className="theme-list-card">
              <p className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Especialidades</p>
              <p className="mt-2 text-lg font-display text-[var(--theme-navy)]">
                {profile?.serviceTypes.join(", ") || "Não definidas"}
              </p>
            </div>
          </div>
        </SectionShell>

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

        <SectionShell
          tone="tint"
          eyebrow="Candidaturas"
          title="Candidaturas enviadas"
          description="Acompanhe status e contexto das vagas onde você já demonstrou interesse."
        >
          {applications.length === 0 ? (
            <div className="theme-card-soft rounded-3xl p-5 text-sm text-[var(--theme-muted)]">
              Nenhuma candidatura enviada ainda.
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {applications.map((application) => (
                <li key={application.id} className="theme-list-card p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="theme-chip theme-chip-blue">
                      {application.job.city}/{application.job.state}
                    </span>
                    <span className="theme-chip theme-chip-yellow">{application.status}</span>
                  </div>

                  <h2 className="mt-4 text-2xl font-display text-[var(--theme-navy)]">
                    {application.job.title}
                  </h2>
                </li>
              ))}
            </ul>
          )}
        </SectionShell>
      </div>
    </main>
  );
}
