import { auth, signIn } from "@/auth";
import { BlobDecor } from "@/components/theme/blob-decor";
import { CtaButton } from "@/components/theme/cta-button";
import { MetricCard } from "@/components/theme/metric-card";
import { SectionShell } from "@/components/theme/section-shell";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const services = [
  {
    title: "Babás para rotina diária",
    description:
      "Conecte sua família a profissionais para períodos fixos, apoio escolar e cuidados do dia a dia.",
    tone: "pink" as const,
  },
  {
    title: "Cuidadoras de idosos",
    description:
      "Encontre cuidadoras com experiência para acompanhamento, medicação assistida e presença segura.",
    tone: "blue" as const,
  },
  {
    title: "Contratações com moderação",
    description:
      "Perfis verificados, denúncias e revisão administrativa para aumentar confiança na jornada.",
    tone: "yellow" as const,
  },
  {
    title: "Chat e contato protegido",
    description:
      "A conversa só é liberada depois do aceite, preservando privacidade e reduzindo exposição indevida.",
    tone: "indigo" as const,
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Crie seu perfil",
    description: "Família ou profissional faz cadastro com Google e conclui o onboarding inicial.",
  },
  {
    step: "02",
    title: "Publique ou candidate-se",
    description: "A família abre uma vaga e os profissionais aplicam com mensagem inicial.",
  },
  {
    step: "03",
    title: "Aprovação e contrato",
    description: "Ao aceitar candidatura, contrato entra em andamento e o chat privado é liberado.",
  },
  {
    step: "04",
    title: "Conclua e avalie",
    description: "Depois da contratação, ambas as partes avaliam para fortalecer reputação.",
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

export default async function Home() {
  const session = await auth();

  const [openJobs, verifiedProfessionals] = await Promise.all([
    prisma.jobPost.count({ where: { status: "OPEN", isVisible: true } }),
    prisma.professionalProfile.count({ where: { verificationStatus: "VERIFIED" } }),
  ]);

  return (
    <main className="theme-page">
      <div className="theme-container space-y-6 sm:space-y-8">
        <SectionShell
          tone="light"
          className="px-6 py-10 sm:px-10 sm:py-12"
          eyebrow="Marketplace de cuidado"
          title="Encontre babás e cuidadoras com uma experiência humana, clara e segura"
          description="A Cuidou conecta famílias e profissionais com um fluxo completo de publicação de vagas, candidatura, aceite, contrato, chat e avaliação."
        >
          <div className="grid gap-8 lg:grid-cols-[1.05fr_minmax(16rem,0.95fr)] lg:items-center">
            <div className="flex flex-wrap gap-3">
              {session?.user ? (
                <CtaButton href="/dashboard" size="lg">
                  Ir para dashboard
                </CtaButton>
              ) : (
                <form
                  action={async () => {
                    "use server";
                    await signIn("google", { redirectTo: "/dashboard" });
                  }}
                >
                  <CtaButton type="submit" size="lg">
                    Entrar com Google
                  </CtaButton>
                </form>
              )}

              <CtaButton href="/marketplace/jobs" variant="outline" size="lg">
                Ver vagas
              </CtaButton>

              <CtaButton href="/marketplace/professionals" variant="soft" size="lg">
                Ver profissionais
              </CtaButton>
            </div>

            <div className="relative overflow-hidden rounded-[32px] border border-[var(--theme-border)] bg-gradient-to-br from-[var(--theme-indigo)] via-[var(--theme-indigo-strong)] to-[#172675] p-6 text-white shadow-[0_34px_70px_-45px_rgba(20,35,112,0.95)]">
              <BlobDecor tone="pink" className="-right-8 -top-8 h-24 w-24 opacity-80" />
              <BlobDecor tone="yellow" className="-left-6 bottom-3 h-20 w-20 opacity-70" />
              <p className="theme-chip theme-chip-pink">Fluxo principal</p>
              <p className="mt-4 text-lg font-display leading-tight text-white">
                Vaga → candidatura → aceite → contrato → chat → avaliação.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-white/85">
                <li>• Contato liberado somente após aprovação.</li>
                <li>• Agenda por turnos e exceções por data.</li>
                <li>• Moderação híbrida para aumentar confiança.</li>
              </ul>
            </div>
          </div>
        </SectionShell>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Vagas abertas" value={openJobs} tone="pink" />
          <MetricCard
            label="Profissionais verificados"
            value={verifiedProfessionals}
            tone="blue"
          />
          <MetricCard
            label="Disponibilidade por calendário"
            value="Sem texto solto"
            hint="Turnos fixos semanais + exceções por data"
            tone="yellow"
          />
          <MetricCard
            label="Segurança da plataforma"
            value="Contato protegido"
            hint="Chat e dados de contato só após aceite"
            tone="indigo"
          />
        </section>

        <SectionShell
          tone="tint"
          eyebrow="Serviços"
          title="O que você encontra na Cuidou"
          description="Um marketplace pensado para cuidado infantil e cuidado de idosos, com clareza em cada etapa."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((service) => (
              <article key={service.title} className="theme-list-card">
                <p
                  className={`theme-chip ${
                    service.tone === "pink"
                      ? "theme-chip-pink"
                      : service.tone === "blue"
                        ? "theme-chip-blue"
                        : service.tone === "yellow"
                          ? "theme-chip-yellow"
                          : "theme-chip-indigo"
                  }`}
                >
                  Serviço
                </p>
                <h3 className="mt-3 text-xl font-display text-[var(--theme-navy)]">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--theme-body)]">
                  {service.description}
                </p>
              </article>
            ))}
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
                className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur"
              >
                <p className="inline-flex rounded-full bg-white/20 px-2.5 py-1 text-xs font-display text-white">
                  {item.step}
                </p>
                <h3 className="mt-3 text-lg font-display text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/85">{item.description}</p>
              </article>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          tone="light"
          eyebrow="Depoimentos"
          title="Famílias e profissionais aprovam a experiência"
          description="Conteúdos estáticos de demonstração para guiar o visual da seção social proof na fase de design."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.author} className="theme-card-soft rounded-3xl p-5">
                <p className="text-base leading-relaxed text-[var(--theme-body)]">“{item.quote}”</p>
                <p className="mt-4 text-sm font-display text-[var(--theme-indigo)]">{item.author}</p>
              </article>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          tone="deep"
          className="px-6 py-10 sm:px-10"
          eyebrow="Próximo passo"
          title="Comece hoje mesmo a usar a Cuidou"
          description="Publique sua vaga ou candidate-se em oportunidades abertas com um fluxo orientado à confiança."
        >
          <div className="flex flex-wrap gap-3">
            {session?.user ? (
              <CtaButton href="/dashboard" variant="light" size="lg">
                Acessar painel
              </CtaButton>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/dashboard" });
                }}
              >
                <CtaButton type="submit" variant="light" size="lg">
                  Criar conta com Google
                </CtaButton>
              </form>
            )}
            <Link
              href="/marketplace/jobs"
              className="btn-soft inline-flex items-center justify-center"
            >
              Explorar vagas
            </Link>
          </div>
        </SectionShell>

        <footer className="rounded-[30px] border border-[var(--theme-border)] bg-white/80 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-xl font-display text-[var(--theme-navy)]">
                Receba novidades sobre o marketplace
              </h2>
              <p className="mt-1 text-sm text-[var(--theme-muted)]">
                Seção visual de newsletter (sem integração de envio nesta fase).
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Seu e-mail"
                className="theme-field w-full min-w-[14rem]"
                disabled
              />
              <button type="button" className="btn-primary" disabled>
                Enviar
              </button>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
