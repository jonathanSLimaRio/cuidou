import { auth } from "@/auth";
import { LeadCaptureForm } from "./lead-capture-form";
import { AppIcon } from "@/components/theme/app-icon";
import { BlobDecor } from "@/components/theme/blob-decor";
import { CtaButton } from "@/components/theme/cta-button";
import { MetricCard } from "@/components/theme/metric-card";
import { SectionShell } from "@/components/theme/section-shell";
import { StatusBadge } from "@/components/theme/status-badge";
import type { DesignMediaKey } from "@/content/design-media-catalog";
import { resolveDesignImage } from "@/lib/design-media";
import { prisma } from "@/lib/prisma";
import { getWordPressMediaGallery, pickWordPressImage } from "@/lib/wordpress-content";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  LayoutDashboard,
  LogIn,
  MessageCircleMore,
  ShieldCheck,
  Users,
} from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

const serviceImageKeys: DesignMediaKey[] = [
  "serviceBabysitter",
  "serviceElderCare",
  "serviceModeration",
  "serviceChat",
];

const featuredImageKeys: DesignMediaKey[] = ["featuredPro1", "featuredPro2", "featuredPro3"];
const testimonialDesignKeys: Array<DesignMediaKey | null> = [
  "testimonialFamily",
  "testimonialProfessional",
  null,
];

const serviceCards = [
  {
    title: "Babás para rotina diária",
    description:
      "Conecte sua família a profissionais para períodos fixos, apoio escolar e cuidados do dia a dia.",
    tag: "Infantil",
    tone: "pink" as const,
  },
  {
    title: "Cuidadoras de idosos",
    description:
      "Encontre cuidadoras com experiência para acompanhamento, medicação assistida e presença segura.",
    tag: "Idoso",
    tone: "blue" as const,
  },
  {
    title: "Contratações com moderação",
    description:
      "Perfis verificados, denúncias e revisão administrativa para aumentar confiança na jornada.",
    tag: "Confiança",
    tone: "yellow" as const,
  },
  {
    title: "Chat e contato protegido",
    description:
      "A conversa só é liberada depois do aceite, preservando privacidade e reduzindo exposição indevida.",
    tag: "Privacidade",
    tone: "indigo" as const,
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Crie seu perfil",
    description: "Família ou profissional faz cadastro com Google e conclui o onboarding inicial.",
    icon: LogIn,
  },
  {
    step: "02",
    title: "Publique ou candidate-se",
    description: "A família abre uma vaga e os profissionais aplicam com mensagem inicial.",
    icon: BriefcaseBusiness,
  },
  {
    step: "03",
    title: "Aprovação e contrato",
    description: "Ao aceitar candidatura, contrato entra em andamento e o chat privado é liberado.",
    icon: MessageCircleMore,
  },
  {
    step: "04",
    title: "Conclua e avalie",
    description: "Depois da contratação, ambas as partes avaliam para fortalecer reputação.",
    icon: BadgeCheck,
  },
];

const testimonials = [
  {
    quote:
      "A plataforma deixou nosso processo de contratação muito mais organizado e transparente.",
    author: "Família de São Paulo",
  },
  {
    quote:
      "Consegui vagas alinhadas com minha disponibilidade semanal e recebi retorno rápido.",
    author: "Cuidadora de idosos, Recife",
  },
  {
    quote:
      "O fluxo com contrato e histórico de mensagens trouxe segurança para as duas partes.",
    author: "Família de Belo Horizonte",
  },
];

function ServiceImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-cream)]">
      <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" />
    </div>
  );
}

function VisualFallback() {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-cream)]">
      <BlobDecor tone="pink" className="-left-8 top-5 h-28 w-28 opacity-80" />
      <BlobDecor tone="blue" className="-right-8 bottom-4 h-28 w-28 opacity-80" />
      <BlobDecor tone="yellow" className="left-1/3 top-1/3 h-20 w-20 opacity-70" />
    </div>
  );
}

export default async function Home() {
  const session = await auth();

  const openJobsPromise = prisma.jobPost
    .count({ where: { status: "OPEN", isVisible: true } })
    .catch(() => 0);
  const verifiedProfessionalsPromise = prisma.professionalProfile
    .count({ where: { verificationStatus: "VERIFIED" } })
    .catch(() => 0);
  const featuredProfessionalsPromise = prisma.professionalProfile
    .findMany({
      where: { verificationStatus: "VERIFIED" },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      take: 3,
      orderBy: { updatedAt: "desc" },
    })
    .catch(() => []);
  const galleryPromise = getWordPressMediaGallery(32).catch(() => []);

  const [openJobs, verifiedProfessionals, featuredProfessionals, gallery] = await Promise.all([
    openJobsPromise,
    verifiedProfessionalsPromise,
    featuredProfessionalsPromise,
    galleryPromise,
  ]);

  const heroImage = resolveDesignImage(
    "homeHero",
    gallery,
    0,
    "Profissional de cuidado atendendo família",
  );

  return (
    <main className="theme-page">
      <div className="theme-container space-y-6 sm:space-y-7">
        <SectionShell
          tone="light"
          className="px-5 py-7 sm:px-8 sm:py-10"
          eyebrow="Marketplace de cuidado"
          title="Encontre babás e cuidadoras com uma experiência humana, clara e segura"
          description="A Cuidou conecta famílias e profissionais com fluxo completo de vaga, candidatura, aceite, contrato, chat e avaliação."
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(16rem,0.95fr)] lg:items-center">
            <div className="space-y-5">
              <p className="text-sm leading-relaxed text-[var(--theme-body)]">
                Sem intermediação de pagamento, com contato protegido até aprovação e moderação híbrida para reforçar confiança.
              </p>

              <div className="flex flex-wrap gap-2.5">
                {session?.user ? (
                  <CtaButton href="/dashboard" size="lg" icon={LayoutDashboard}>
                    Ir para dashboard
                  </CtaButton>
                ) : (
                  <CtaButton href="/login" size="lg" icon={LogIn}>
                    Entrar
                  </CtaButton>
                )}

                <CtaButton href="/marketplace/jobs" variant="outline" size="lg" icon={BriefcaseBusiness}>
                  Ver vagas
                </CtaButton>

                <CtaButton href="/marketplace/professionals" variant="soft" size="lg" icon={Users}>
                  Ver profissionais
                </CtaButton>
              </div>

              <div className="theme-card-soft rounded-3xl px-4 py-4 text-sm text-[var(--theme-body)]">
                <p className="theme-chip theme-chip-pink w-fit">Fluxo principal</p>
                <p className="mt-3 font-display text-lg text-[var(--theme-navy)]">
                  Vaga - candidatura - aceite - contrato - chat - avaliação
                </p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--theme-muted)]">
                  <li className="inline-flex items-center gap-2">
                    <AppIcon icon={ShieldCheck} size="sm" />
                    Contato liberado somente após aprovação.
                  </li>
                  <li className="inline-flex items-center gap-2">
                    <AppIcon icon={CalendarClock} size="sm" />
                    Agenda por turnos e exceções por data.
                  </li>
                  <li className="inline-flex items-center gap-2">
                    <AppIcon icon={BadgeCheck} size="sm" />
                    Moderação híbrida para aumentar confiança.
                  </li>
                </ul>
              </div>
            </div>

            <div>
              {heroImage ? (
                <ServiceImage src={heroImage.src} alt={heroImage.alt} />
              ) : (
                <VisualFallback />
              )}
            </div>
          </div>
        </SectionShell>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Vagas abertas" value={openJobs} tone="pink" />
          <MetricCard label="Profissionais verificados" value={verifiedProfessionals} tone="blue" />
          <MetricCard
            label="Disponibilidade por calendário"
            value="Sem texto solto"
            hint="Turnos semanais + exceções por data"
            tone="yellow"
          />
          <MetricCard
            label="Contato protegido"
            value="Privacidade ativa"
            hint="Contato e chat liberados após aceite"
            tone="indigo"
          />
        </section>

        <SectionShell
          tone="tint"
          eyebrow="Serviços"
          title="O que você encontra na Cuidou"
          description="Um marketplace pensado para cuidado infantil e de idosos, com clareza em cada etapa."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {serviceCards.map((service, index) => {
              const image = resolveDesignImage(
                serviceImageKeys[index],
                gallery,
                index + 1,
                service.title,
              );
              const statusTone =
                service.tone === "pink"
                  ? "pink"
                  : service.tone === "blue"
                    ? "blue"
                    : service.tone === "yellow"
                      ? "yellow"
                      : "indigo";

              return (
                <article key={service.title} className="theme-list-card p-4 sm:p-5">
                  {image ? <ServiceImage src={image.src} alt={image.alt} /> : <VisualFallback />}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <StatusBadge tone={statusTone}>{service.tag}</StatusBadge>
                  </div>
                  <h3 className="mt-3 text-2xl">{service.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--theme-body)]">{service.description}</p>
                </article>
              );
            })}
          </div>
        </SectionShell>

        <SectionShell
          tone="deep"
          eyebrow="Como funciona"
          title="4 passos para contratar com tranquilidade"
          description="A jornada foi desenhada para reduzir atrito, organizar comunicação e registrar decisões com transparência."
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item) => (
              <article
                key={item.step}
                className="rounded-3xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur"
              >
                <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-2.5 py-1 text-xs font-display text-white">
                  <AppIcon icon={item.icon} size="sm" />
                  {item.step}
                </p>
                <h3 className="mt-3 text-xl text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/85">{item.description}</p>
              </article>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          tone="light"
          eyebrow="Profissionais em destaque"
          title="Perfis ativos no marketplace"
          description="Exemplos de profissionais para orientar a linguagem de cards com foco em decisão rápida."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {featuredProfessionals.length === 0 ? (
              <article className="theme-card-soft rounded-3xl p-6 text-sm text-[var(--theme-muted)] lg:col-span-3">
                Nenhum profissional em destaque neste momento.
              </article>
            ) : (
              featuredProfessionals.map((professional, index) => {
                const photo = resolveDesignImage(
                  featuredImageKeys[index] ?? "featuredPro1",
                  gallery,
                  index + 8,
                  professional.user.name ?? "Profissional",
                );

                return (
                  <article key={professional.id} className="theme-list-card p-5">
                    {photo ? <ServiceImage src={photo.src} alt={photo.alt} /> : <VisualFallback />}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <StatusBadge tone="indigo">Verificado</StatusBadge>
                      <StatusBadge tone="yellow">
                        {professional.city}/{professional.state}
                      </StatusBadge>
                    </div>
                    <h3 className="mt-3 text-2xl">{professional.user.name ?? "Profissional"}</h3>
                    <p className="mt-2 text-sm text-[var(--theme-body)]">
                      {professional.bio ?? "Perfil com disponibilidade atualizada e documentação validada."}
                    </p>
                  </article>
                );
              })
            )}
          </div>
        </SectionShell>

        <SectionShell
          tone="light"
          eyebrow="Depoimentos"
          title="Famílias e profissionais aprovam a experiência"
          description="Conteúdos estáticos de demonstração para guiar seção de social proof com visual mais humano."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {testimonials.map((item, index) => {
              const selectedKey = testimonialDesignKeys[index];
              const avatar = selectedKey
                ? resolveDesignImage(selectedKey, gallery, index + 16, item.author)
                : pickWordPressImage(gallery, index + 16, item.author);

              return (
                <article key={item.author} className="theme-card-soft rounded-3xl p-5">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-[var(--theme-border)] bg-[var(--theme-cream)]">
                      {avatar ? (
                        <Image src={avatar.src} alt={avatar.alt} fill sizes="48px" className="object-cover" />
                      ) : null}
                    </div>
                    <p className="text-sm font-display text-[var(--theme-indigo)]">{item.author}</p>
                  </div>
                  <p className="mt-4 text-base leading-relaxed text-[var(--theme-body)]">&quot;{item.quote}&quot;</p>
                </article>
              );
            })}
          </div>
        </SectionShell>

        <SectionShell
          tone="deep"
          className="px-6 py-9 sm:px-10"
          eyebrow="Próximo passo"
          title="Comece hoje mesmo a usar a Cuidou"
          description="Publique sua vaga ou candidate-se em oportunidades abertas com um fluxo orientado à confiança."
        >
          <div className="flex flex-wrap gap-3">
            {session?.user ? (
              <CtaButton href="/dashboard" variant="light" size="lg" icon={LayoutDashboard}>
                Acessar painel
              </CtaButton>
            ) : (
              <CtaButton href="/login" variant="light" size="lg" icon={LogIn}>
                Entrar
              </CtaButton>
            )}
            <CtaButton
              href="/marketplace/jobs"
              variant="soft"
              size="lg"
              icon={BriefcaseBusiness}
              className="border-white/30 bg-white/25 text-[var(--theme-indigo-strong)]"
            >
              Explorar vagas
            </CtaButton>
          </div>
        </SectionShell>

        <footer className="theme-card rounded-[30px] px-6 py-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-2xl">Receba novidades sobre o marketplace</h2>
              <p className="mt-2 text-sm text-[var(--theme-muted)]">
                Entre na lista de espera para receber novidades do marketplace e avisos sobre o piloto na sua região.
              </p>
            </div>
            <LeadCaptureForm />
          </div>
        </footer>
      </div>
    </main>
  );
}
