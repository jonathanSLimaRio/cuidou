import { CtaButton } from "@/components/theme/cta-button";
import { PageHeader } from "@/components/theme/page-header";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const sections = [
  {
    title: "1. Dados coletados",
    body: "Coletamos dados de identificacao e contato (nome, e-mail, telefone), informacoes de perfil, conteudos de vagas, candidaturas, mensagens, documentos enviados para verificacao e eventos de seguranca.",
  },
  {
    title: "2. Finalidades de tratamento",
    body: "Utilizamos os dados para operacao do marketplace, autenticacao, moderacao, prevencao a fraude, notificacoes transacionais e melhoria da experiencia do produto.",
  },
  {
    title: "3. Base legal (LGPD)",
    body: "O tratamento de dados pode ocorrer por execucao de contrato, cumprimento de obrigacao legal, exercicio regular de direitos e legitimo interesse, conforme a natureza de cada fluxo.",
  },
  {
    title: "4. Compartilhamento de dados",
    body: "Dados podem ser compartilhados com provedores de infraestrutura e comunicacao estritamente necessarios para operar o servico (ex.: autenticacao, banco de dados, notificacoes e armazenamento de arquivos).",
  },
  {
    title: "5. Retencao e seguranca",
    body: "Mantemos os dados pelo tempo necessario para cumprir finalidades legais e operacionais, adotando medidas tecnicas e administrativas para protecao contra acesso nao autorizado.",
  },
  {
    title: "6. Direitos do titular",
    body: "Voce pode solicitar confirmacao de tratamento, acesso, correcao, anonimização, portabilidade, eliminacao e revisao, nos limites da legislacao aplicavel.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="theme-page">
      <div className="theme-container space-y-6">
        <PageHeader
          eyebrow="Legal"
          title="Politica de Privacidade"
          description="Como a Cuidou coleta, usa e protege dados pessoais."
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Politica de Privacidade" },
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
            Solicitacoes relacionadas a privacidade podem ser enviadas para{" "}
            <Link className="underline underline-offset-2" href="mailto:privacidade@cuidou.app">
              privacidade@cuidou.app
            </Link>
            .
          </div>
        </section>
      </div>
    </main>
  );
}
