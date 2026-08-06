import { auth } from "@/auth";
import { CtaButton } from "@/components/theme/cta-button";
import { SectionShell } from "@/components/theme/section-shell";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  LayoutDashboard,
  MessageCircleMore,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import Image from "next/image";
import { LeadCaptureForm } from "./lead-capture-form";

const steps = [
  {
    title: "Conte o que você precisa",
    description: "Escolha o tipo de cuidado, sua cidade e a rotina desejada.",
    icon: Search,
  },
  {
    title: "Conheça com contexto",
    description: "Compare experiência, disponibilidade e status de verificação.",
    icon: Users,
  },
  {
    title: "Converse com proteção",
    description: "O chat é liberado após o aceite e mantém o histórico da jornada.",
    icon: MessageCircleMore,
  },
];

export default async function Home() {
  const session = await auth();

  return (
    <main id="main-content" className="theme-page pb-0">
      <div className="theme-container space-y-8 sm:space-y-12">
        <section className="editorial-hero" aria-labelledby="home-title">
          <div className="space-y-6 px-5 py-8 sm:px-9 sm:py-12 lg:px-12">
            <p className="editorial-kicker">Cuidado começa com confiança</p>
            <h1 id="home-title" className="max-w-3xl text-4xl leading-[1.04] sm:text-5xl lg:text-6xl">
              Encontre quem cuida com presença — e uma rotina que funciona para todos.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-[var(--theme-body)]">
              A Cuidou aproxima famílias, babás e profissionais de cuidado de idosos com
              perfis claros, disponibilidade organizada e contato protegido.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
              <CtaButton href="/marketplace/professionals" size="lg" icon={Users}>
                Preciso contratar
              </CtaButton>
              <CtaButton href="/marketplace/jobs" size="lg" variant="outline" icon={BriefcaseBusiness}>
                Quero trabalhar
              </CtaButton>
            </div>
            <p className="flex max-w-2xl items-start gap-2 text-sm leading-relaxed text-[var(--theme-muted)]">
              <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              A Cuidou organiza a conexão e a comunicação. A contratação e o pagamento são
              combinados diretamente entre as pessoas.
            </p>
          </div>
          <div className="relative min-h-[20rem] overflow-hidden lg:min-h-full">
            <Image
              src="/illustrations/cuidou-care-network-v1.webp"
              alt="Profissional de cuidado, pessoa idosa e familiar conversando em uma sala acolhedora"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="object-cover"
            />
          </div>
        </section>

        <section aria-labelledby="paths-title" className="grid gap-4 lg:grid-cols-2">
          <h2 id="paths-title" className="sr-only">Escolha seu caminho</h2>
          <article className="persona-card persona-card-family">
            <div>
              <p className="editorial-kicker">Para famílias</p>
              <h3 className="mt-3 text-3xl">Cuidado que cabe na sua rotina</h3>
              <p className="mt-3 max-w-xl leading-relaxed">
                Busque por especialidade e região, conheça perfis verificados e convide quem
                combina com as necessidades da sua família.
              </p>
            </div>
            <CtaButton href="/marketplace/professionals" variant="outline" icon={ArrowRight} iconPosition="right">
              Buscar profissionais
            </CtaButton>
          </article>
          <article className="persona-card persona-card-professional">
            <div>
              <p className="editorial-kicker">Para profissionais</p>
              <h3 className="mt-3 text-3xl">Oportunidades com expectativas claras</h3>
              <p className="mt-3 max-w-xl leading-relaxed">
                Encontre vagas por tipo de cuidado e localização, apresente sua experiência e
                acompanhe cada etapa em um só lugar.
              </p>
            </div>
            <CtaButton href="/marketplace/jobs" variant="light" icon={ArrowRight} iconPosition="right">
              Explorar vagas
            </CtaButton>
          </article>
        </section>

        <SectionShell
          tone="light"
          eyebrow="Como funciona"
          title="Um caminho simples para uma decisão importante"
          description="Informação útil aparece no momento certo, sem promessas vagas nem atalhos na segurança."
        >
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="editorial-step">
                <span className="editorial-step-number">{index + 1}</span>
                <step.icon className="size-7 text-[var(--theme-plum)]" aria-hidden="true" />
                <h3 className="text-xl">{step.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--theme-muted)]">{step.description}</p>
              </li>
            ))}
          </ol>
        </SectionShell>

        <section className="safety-panel" aria-labelledby="safety-title">
          <div>
            <p className="editorial-kicker text-white/75">Segurança e transparência</p>
            <h2 id="safety-title" className="mt-3 max-w-2xl text-3xl text-white sm:text-4xl">
              Mais contexto antes de abrir espaço na sua casa ou na sua agenda.
            </h2>
          </div>
          <ul className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              "Perfis e documentos passam por revisão",
              "Status e regras aparecem em linguagem clara",
              "Chat e contato seguem o fluxo de aceite",
              "Denúncia, bloqueio e moderação ficam acessíveis",
            ].map((item) => (
              <li key={item} className="flex min-h-11 items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <CheckCircle2 className="size-5 shrink-0 text-[var(--theme-coral)]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="theme-card p-6 sm:p-9" aria-labelledby="proof-title">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <BadgeCheck className="size-9 text-[var(--theme-teal)]" aria-hidden="true" />
              <h2 id="proof-title" className="mt-4 text-3xl">Confiança não é um número solto</h2>
            </div>
            <p className="text-base leading-relaxed text-[var(--theme-body)]">
              Enquanto a operação piloto constrói uma base pública de resultados, a Cuidou não
              exibe depoimentos inventados nem métricas sem região e data de atualização. A prova
              social será publicada apenas com consentimento e contexto verificável.
            </p>
          </div>
        </section>

        <section className="final-cta" aria-labelledby="final-cta-title">
          <div>
            <p className="editorial-kicker">Seu próximo passo</p>
            <h2 id="final-cta-title" className="mt-2 text-3xl sm:text-4xl">
              Comece pela busca ou organize seu perfil.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {session?.user ? (
              <CtaButton href="/dashboard" size="lg" icon={LayoutDashboard}>Abrir meu painel</CtaButton>
            ) : (
              <CtaButton href="/signup" size="lg" icon={BadgeCheck}>Criar minha conta</CtaButton>
            )}
            <CtaButton href="/marketplace" size="lg" variant="outline" icon={Search}>Explorar agora</CtaButton>
          </div>
        </section>

        <section className="newsletter-panel" aria-labelledby="newsletter-title">
          <div>
            <h2 id="newsletter-title" className="text-2xl">Novidades da Cuidou</h2>
            <p className="mt-2 text-sm text-[var(--theme-muted)]">
              Receba avisos sobre o piloto e a chegada do marketplace à sua região.
            </p>
          </div>
          <LeadCaptureForm />
        </section>
      </div>
    </main>
  );
}
