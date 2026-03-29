import { CtaButton } from "@/components/theme/cta-button";
import { PageHeader } from "@/components/theme/page-header";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const sections = [
  {
    title: "1. Objeto da plataforma",
    body: "A Cuidou conecta familias e profissionais de cuidado infantil e de idosos para interacoes de contratacao. Nao realizamos intermedicao de pagamento e nao somos parte do contrato privado firmado entre as partes.",
  },
  {
    title: "2. Cadastro e responsabilidade de conta",
    body: "Cada usuario deve fornecer informacoes verdadeiras, manter seus dados atualizados e proteger as credenciais de acesso. O compartilhamento de conta com terceiros e proibido.",
  },
  {
    title: "3. Regras de uso e conduta",
    body: "E vedado publicar conteudo ilicito, discriminatorio, ofensivo ou fraudulento. Perfis, vagas, mensagens e documentos podem ser moderados e auditados para garantir seguranca e integridade do marketplace.",
  },
  {
    title: "4. Contratacao e relacionamento entre as partes",
    body: "A decisao de contratar, os termos de trabalho e eventuais obrigacoes legais sao de responsabilidade exclusiva da familia e da profissional envolvidas no acordo.",
  },
  {
    title: "5. Suspensao e encerramento",
    body: "Contas podem ser suspensas ou banidas em casos de violacao destes termos, fraude, abuso da plataforma ou descumprimento de obrigacoes legais.",
  },
  {
    title: "6. Atualizacoes destes termos",
    body: "Podemos atualizar estes Termos de Uso para refletir mudancas de produto, operacao ou legislacao aplicavel. A versao vigente sera publicada nesta pagina.",
  },
];

export default function TermsPage() {
  return (
    <main className="theme-page">
      <div className="theme-container space-y-6">
        <PageHeader
          eyebrow="Legal"
          title="Termos de Uso"
          description="Regras gerais para uso da plataforma Cuidou."
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Termos de Uso" },
          ]}
          actions={
            <CtaButton href="/" variant="outline" icon={ArrowLeft}>
              Voltar para home
            </CtaButton>
          }
        />

        <section className="theme-card rounded-[34px] px-6 py-7 sm:px-8">
          <p className="text-sm text-[var(--theme-muted)]">
            Ultima atualizacao: 29/03/2026
          </p>

          <div className="mt-5 space-y-5">
            {sections.map((section) => (
              <article key={section.title} className="theme-list-card p-5">
                <h2 className="text-2xl text-[var(--theme-navy)]">{section.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--theme-body)]">
                  {section.body}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-[var(--theme-border)] bg-white px-4 py-3 text-sm text-[var(--theme-body)]">
            Em caso de duvidas, entre em contato pelo e-mail{" "}
            <Link className="underline underline-offset-2" href="mailto:suporte@cuidou.app">
              suporte@cuidou.app
            </Link>
            .
          </div>
        </section>
      </div>
    </main>
  );
}
