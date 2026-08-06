import { ActionButton } from "@/components/theme/action-button";
import { CtaButton } from "@/components/theme/cta-button";
import { EmptyState } from "@/components/theme/empty-state";
import { PageHeader } from "@/components/theme/page-header";
import { StatusBadge } from "@/components/theme/status-badge";
import { prisma } from "@/lib/prisma";
import { UserStatus, VerificationStatus } from "@prisma/client";
import { BriefcaseBusiness, Eye, Filter, LogIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

type SearchParams = Promise<{
  serviceType?: string;
  state?: string;
  city?: string;
  availability?: string;
}>;

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profissionais de cuidado | Cuidou", description: "Busque profissionais verificados por especialidade, região e disponibilidade." };

const serviceTypeOptions = [
  { value: "", label: "Todas especialidades" },
  { value: "BABYSITTER", label: "Babá" },
  { value: "ELDER_CAREGIVER", label: "Cuidadora de idosos" },
];

export default async function MarketplaceProfessionalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolved = await searchParams;
  const serviceType = resolved.serviceType || "";
  const state = resolved.state?.trim() || "";
  const city = resolved.city?.trim() || "";
  const availability = ["MORNING", "AFTERNOON", "EVENING", "OVERNIGHT"].includes(
    resolved.availability ?? "",
  )
    ? resolved.availability
    : undefined;

  const where = {
    ...(serviceType
      ? { serviceTypes: { has: serviceType as "BABYSITTER" | "ELDER_CAREGIVER" } }
      : {}),
    ...(state ? { state } : {}),
    ...(city ? { city } : {}),
    verificationStatus: VerificationStatus.VERIFIED,
    user: { status: UserStatus.ACTIVE },
    ...(availability
      ? { availabilitySlots: { some: { shift: availability as "MORNING" | "AFTERNOON" | "EVENING" | "OVERNIGHT", isAvailable: true } } }
      : {}),
  };

  const professionals = await prisma.professionalProfile.findMany({
      where,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        bio: true,
        serviceTypes: true,
        state: true,
        city: true,
        verificationStatus: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        availabilitySlots: {
          where: { isAvailable: true },
          select: {
            weekday: true,
            shift: true,
          },
          take: 6,
        },
      },
      take: 60,
    });

  return (
    <main className="theme-page">
      <div className="theme-container space-y-6">
        <PageHeader
          eyebrow="Marketplace público"
          title="Profissionais disponíveis"
          description="Perfis com disponibilidade organizada, especialidades claras e sinalização de verificação para apoiar sua escolha."
          actions={
            <>
              <CtaButton href="/marketplace/jobs" variant="outline" icon={BriefcaseBusiness}>
                Explorar vagas
              </CtaButton>
              <CtaButton href="/login" variant="primary" icon={LogIn}>
                Entrar com Google
              </CtaButton>
            </>
          }
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Profissionais" },
          ]}
        />

        <section className="theme-card rounded-[32px] px-5 py-6 sm:px-6">
          <form className="grid gap-3 md:grid-cols-[1.1fr_0.8fr_1fr_0.9fr_auto] md:items-end">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Especialidade</span>
              <select name="serviceType" defaultValue={serviceType} className="theme-select">
                {serviceTypeOptions.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Estado</span>
              <input name="state" defaultValue={state} placeholder="Ex: RJ" className="theme-field" />
            </label>

            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Cidade</span>
              <input name="city" defaultValue={city} placeholder="Ex: Niterói" className="theme-field" />
            </label>

            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Disponibilidade</span>
              <select name="availability" defaultValue={availability ?? ""} className="theme-select">
                <option value="">Qualquer horário</option>
                <option value="MORNING">Manhã</option>
                <option value="AFTERNOON">Tarde</option>
                <option value="EVENING">Noite</option>
                <option value="OVERNIGHT">Pernoite</option>
              </select>
            </label>

            <ActionButton type="submit" icon={Filter} className="w-full md:w-auto">
              Filtrar
            </ActionButton>
          </form>
        </section>

        {professionals.length === 0 ? (
          <EmptyState
            title="Nenhum profissional encontrado"
            description="Tente ajustar filtros de localização ou especialidade. Novos perfis entram no marketplace continuamente."
            action={
              <CtaButton href="/marketplace/professionals" variant="outline" icon={Filter}>
                Limpar filtros
              </CtaButton>
            }
            icon="perfil"
          />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {professionals.map((professional, index) => {
              const profileImage = professional.user.image;
              return (
                <Link
                  key={professional.id}
                  href={`/marketplace/professionals/${professional.id}`}
                  className="theme-list-card block p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-indigo)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-cream)]">
                    <Image
                      src={profileImage || "/illustrations/cuidou-marketplace-v1.webp"}
                      alt={profileImage ? `Foto de perfil de ${professional.user.name ?? "profissional"}` : ""}
                      fill
                      priority={index === 0}
                      loading={index === 0 ? "eager" : "lazy"}
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusBadge
                      tone={
                        professional.verificationStatus === VerificationStatus.VERIFIED
                          ? "success"
                          : "neutral"
                      }
                    >
                      {professional.verificationStatus === VerificationStatus.VERIFIED
                        ? "Verificado"
                        : "Não verificado"}
                    </StatusBadge>
                    <StatusBadge tone="yellow">
                      {professional.city ?? "-"}/{professional.state ?? "-"}
                    </StatusBadge>
                  </div>

                  <h2 className="mt-3 text-2xl leading-tight">
                    {professional.user.name ?? "Profissional"}
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {professional.serviceTypes.map((serviceType) => (
                      <StatusBadge key={serviceType} tone="info">
                        {serviceType === "BABYSITTER" ? "Babá" : "Cuidadora"}
                      </StatusBadge>
                    ))}
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--theme-body)]">
                    {professional.bio ?? "Profissional com perfil e disponibilidade atualizados na plataforma."}
                  </p>

                  <div className="mt-4 theme-divider" />

                  <p className="mt-3 text-xs text-[var(--theme-muted)]">
                    Disponibilidade registrada em {professional.availabilitySlots.length} turnos.
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--theme-indigo)]">
                    <Eye size={16} />
                    Ver detalhes
                  </p>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
