import { CtaButton } from "@/components/theme/cta-button";
import type { Metadata } from "next";
import { BriefcaseBusiness, Search, ShieldCheck, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Buscar cuidado e vagas | Cuidou",
  description: "Busque profissionais e vagas de cuidado por especialidade, estado, cidade e disponibilidade.",
};

export default function MarketplacePage() {
  return (
    <main id="main-content" className="theme-page">
      <div className="theme-container space-y-8">
        <section className="marketplace-search" aria-labelledby="marketplace-title">
          <div className="max-w-3xl">
            <p className="editorial-kicker">Busca pública</p>
            <h1 id="marketplace-title" className="mt-3 text-4xl sm:text-5xl">
              Que tipo de cuidado faz sentido para você hoje?
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-[var(--theme-body)]">
              Use os filtros uma vez e escolha se quer encontrar profissionais ou oportunidades de trabalho.
            </p>
          </div>

          <form className="mt-8 grid gap-4" role="search">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="field-label">
                <span>Tipo de cuidado</span>
                <select name="serviceType" className="theme-select" defaultValue="">
                  <option value="">Todos</option>
                  <option value="BABYSITTER">Cuidado infantil</option>
                  <option value="ELDER_CAREGIVER">Cuidado de idosos</option>
                </select>
              </label>
              <label className="field-label">
                <span>Estado</span>
                <input name="state" className="theme-field" maxLength={2} placeholder="Ex.: SP" autoComplete="address-level1" />
              </label>
              <label className="field-label">
                <span>Cidade</span>
                <input name="city" className="theme-field" placeholder="Ex.: Campinas" autoComplete="address-level2" />
              </label>
              <label className="field-label">
                <span>Disponibilidade</span>
                <select name="availability" className="theme-select" defaultValue="">
                  <option value="">Qualquer horário</option>
                  <option value="MORNING">Manhã</option>
                  <option value="AFTERNOON">Tarde</option>
                  <option value="EVENING">Noite</option>
                  <option value="OVERNIGHT">Pernoite</option>
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 sm:max-w-2xl">
              <button className="search-path-button" formAction="/marketplace/professionals">
                <Users className="size-5" aria-hidden="true" />
                Buscar profissionais
                <Search className="ml-auto size-5" aria-hidden="true" />
              </button>
              <button className="search-path-button search-path-button-alt" formAction="/marketplace/jobs">
                <BriefcaseBusiness className="size-5" aria-hidden="true" />
                Buscar vagas
                <Search className="ml-auto size-5" aria-hidden="true" />
              </button>
            </div>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-2" aria-labelledby="marketplace-help-title">
          <h2 id="marketplace-help-title" className="sr-only">Como usar o marketplace</h2>
          <article className="theme-card p-6 sm:p-8">
            <ShieldCheck className="size-8 text-[var(--theme-teal)]" aria-hidden="true" />
            <h3 className="mt-4 text-2xl">Para quem precisa contratar</h3>
            <p className="mt-3 leading-relaxed text-[var(--theme-muted)]">
              Veja especialidade, localização, disponibilidade e verificação antes de iniciar uma conversa.
            </p>
            <CtaButton className="mt-6" href="/marketplace/professionals" variant="outline" icon={Users}>
              Ver todos os profissionais
            </CtaButton>
          </article>
          <article className="theme-card-deep p-6 sm:p-8">
            <BriefcaseBusiness className="size-8 text-[var(--theme-coral)]" aria-hidden="true" />
            <h3 className="mt-4 text-2xl text-white">Para quem quer trabalhar</h3>
            <p className="mt-3 leading-relaxed text-white/80">
              Explore oportunidades com local, tipo de cuidado e expectativas definidos pela família.
            </p>
            <CtaButton className="mt-6" href="/marketplace/jobs" variant="light" icon={BriefcaseBusiness}>
              Ver todas as vagas
            </CtaButton>
          </article>
        </section>
      </div>
    </main>
  );
}
