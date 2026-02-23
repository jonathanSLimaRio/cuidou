import { ActionButton } from "@/components/theme/action-button";
import { CtaButton } from "@/components/theme/cta-button";
import { EmptyState } from "@/components/theme/empty-state";
import { PageHeader } from "@/components/theme/page-header";
import { StatusBadge } from "@/components/theme/status-badge";
import { resolveDesignImage } from "@/lib/design-media";
import { prisma } from "@/lib/prisma";
import { getWordPressMediaGallery, pickWordPressImage } from "@/lib/wordpress-content";
import { Eye, Filter, LogIn, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  serviceType?: string;
  state?: string;
  city?: string;
}>;

const serviceTypeOptions = [
  { value: "", label: "Todos os serviços" },
  { value: "BABYSITTER", label: "Babá" },
  { value: "ELDER_CAREGIVER", label: "Cuidadora de idosos" },
];

export default async function MarketplaceJobsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolved = await searchParams;
  const serviceType = resolved.serviceType || "";
  const state = resolved.state?.trim() || "";
  const city = resolved.city?.trim() || "";

  const where = {
    status: "OPEN" as const,
    isVisible: true,
    ...(serviceType ? { serviceType: serviceType as "BABYSITTER" | "ELDER_CAREGIVER" } : {}),
    ...(state ? { state } : {}),
    ...(city ? { city } : {}),
  };

  const [jobs, gallery] = await Promise.all([
    prisma.jobPost.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        family: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      take: 60,
    }),
    getWordPressMediaGallery(40),
  ]);

  return (
    <main className="theme-page">
      <div className="theme-container space-y-6">
        <PageHeader
          eyebrow="Marketplace público"
          title="Vagas abertas"
          description="Explore oportunidades para babás e cuidadoras em diferentes cidades e encontre o perfil de vaga ideal para sua rotina."
          actions={
            <>
              <CtaButton href="/login" variant="primary" icon={LogIn}>
                Entrar para se candidatar
              </CtaButton>
              <CtaButton href="/marketplace/professionals" variant="outline" icon={Users}>
                Ver profissionais
              </CtaButton>
            </>
          }
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Vagas" },
          ]}
        />

        <section className="theme-card rounded-[32px] px-5 py-6 sm:px-6">
          <form className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_1fr_auto] md:items-end">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Serviço</span>
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
              <input name="state" defaultValue={state} placeholder="Ex: SP" className="theme-field" />
            </label>

            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Cidade</span>
              <input name="city" defaultValue={city} placeholder="Ex: São Paulo" className="theme-field" />
            </label>

            <ActionButton type="submit" icon={Filter} className="w-full md:w-auto">
              Filtrar
            </ActionButton>
          </form>
        </section>

        {jobs.length === 0 ? (
          <EmptyState
            title="Nenhuma vaga encontrada"
            description="Ajuste seus filtros ou volte mais tarde. Novas vagas são publicadas diariamente por famílias na plataforma."
            action={
              <CtaButton href="/marketplace/jobs" variant="outline" icon={Filter}>
                Limpar filtros
              </CtaButton>
            }
            icon="vaga"
          />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job, index) => {
              const image =
                index === 0
                  ? resolveDesignImage("jobsHero", gallery, index + 5, job.title)
                  : pickWordPressImage(gallery, index + 5, job.title);

              return (
                <Link
                  key={job.id}
                  href={`/marketplace/jobs/${job.id}`}
                  className="theme-list-card block p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-indigo)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-cream)]">
                    {image ? (
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusBadge tone="blue">
                      {job.serviceType === "BABYSITTER" ? "Babá" : "Cuidadora"}
                    </StatusBadge>
                    <StatusBadge tone="yellow">
                      {job.city}/{job.state}
                    </StatusBadge>
                    <StatusBadge tone="neutral">{job._count.applications} candidaturas</StatusBadge>
                  </div>

                  <h2 className="mt-3 text-2xl leading-tight">{job.title}</h2>
                  <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-[var(--theme-body)]">
                    {job.description}
                  </p>

                  <div className="mt-4 theme-divider" />

                  <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[var(--theme-muted)]">
                    <span>Família: {job.family.name ?? "Anônimo"}</span>
                    <span>
                      Faixa: {job.hourlyRateMin ? `R$ ${job.hourlyRateMin}` : "-"}
                      {job.hourlyRateMax ? ` - R$ ${job.hourlyRateMax}` : ""}
                    </span>
                  </div>

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
