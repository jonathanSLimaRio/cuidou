import { CtaButton } from "@/components/theme/cta-button";
import { PageHeader } from "@/components/theme/page-header";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Termos de Uso | Cuidou", description: "Regras para uso seguro do marketplace Cuidou." };

const sections = [
  ["1. Objeto e papel da Cuidou", "A Cuidou oferece um marketplace para aproximar famílias e profissionais de cuidado infantil ou de pessoas idosas. A plataforma organiza descoberta, verificação, candidaturas, convites, comunicação, registros e avaliações. A Cuidou não intermedeia pagamentos, não é empregadora e não integra o contrato firmado diretamente entre os usuários."],
  ["2. Elegibilidade, cadastro e aprovação", "O usuário deve ser maior de 18 anos, fornecer informações verdadeiras, manter dados atualizados e proteger suas credenciais. Cadastros podem depender de aprovação administrativa e verificação documental. Uma pessoa não pode compartilhar conta, assumir identidade de terceiro ou contornar suspensão anterior."],
  ["3. Vagas, perfis e verificação", "Famílias respondem pela clareza e legalidade das vagas. Profissionais respondem pela veracidade de experiência, disponibilidade e documentos. O selo de verificação indica que determinados documentos foram revisados, mas não constitui garantia absoluta de conduta, qualificação ou adequação a uma contratação específica."],
  ["4. Contratação direta e obrigações legais", "As partes decidem livremente se desejam contratar, negociar remuneração, jornada e condições. Cabe aos usuários observar obrigações trabalhistas, previdenciárias, tributárias, civis e de segurança aplicáveis. Registros da plataforma auxiliam a organização, mas não substituem contrato ou orientação profissional."],
  ["5. Conduta e conteúdo proibido", "É proibido publicar conteúdo ilegal, discriminatório, abusivo, sexual, enganoso ou que exponha dados excessivos de crianças e pessoas cuidadas; assediar usuários; solicitar pagamentos fraudulentos; distribuir malware; obter dados por meios automatizados não autorizados; ou usar a plataforma para finalidade incompatível com cuidado e contratação legítima."],
  ["6. Comunicação, denúncias e moderação", "Mensagens, anexos, avaliações e denúncias podem ser analisados quando necessário para segurança, suporte, prevenção a fraude ou exercício de direitos. A Cuidou pode remover conteúdo, limitar funcionalidades e preservar registros relacionados a uma investigação."],
  ["7. Suspensão e encerramento", "Contas podem ser suspensas ou banidas por violação destes Termos, fraude, risco à segurança, abuso ou determinação legal. Sempre que possível, o usuário será informado do motivo e poderá solicitar revisão. O encerramento não elimina imediatamente registros sujeitos a retenção legal ou de segurança."],
  ["8. Disponibilidade e responsabilidade", "A Cuidou busca manter o serviço seguro e disponível, mas pode realizar manutenção ou enfrentar indisponibilidade de terceiros. Nos limites permitidos pela lei, a plataforma não responde por atos dos usuários, negociações externas, perdas indiretas ou informações falsas fornecidas por terceiros."],
  ["9. Propriedade intelectual", "Marca, software, textos, componentes e identidade da Cuidou são protegidos. O usuário mantém direitos sobre seu conteúdo e concede à Cuidou licença limitada para armazená-lo, exibi-lo e processá-lo apenas para operar, proteger e melhorar o serviço."],
  ["10. Lei aplicável e atualizações", "Aplicam-se as leis brasileiras. O foro e os dados empresariais definitivos serão confirmados na revisão jurídica. Mudanças materiais exigirão novo aceite. A versão atual destes Termos é 2026-08-06."],
] as const;

export default function TermsPage() {
  return (
    <main id="main-content" className="theme-page"><div className="theme-container space-y-6">
      <PageHeader eyebrow="Legal" title="Termos de Uso" description="Regras gerais para uso da plataforma Cuidou." breadcrumbs={[{ label: "Home", href: "/" }, { label: "Termos de Uso" }]} actions={<CtaButton href="/" variant="outline" icon={ArrowLeft}>Voltar para home</CtaButton>} />
      <section className="theme-card rounded-[34px] px-6 py-7 sm:px-8">
        <p className="text-sm text-[var(--theme-muted)]">Última atualização: 06/08/2026 · Versão 2026-08-06</p>
        <div className="mt-5 space-y-5">{sections.map(([title, body]) => <article key={title} className="theme-list-card p-5"><h2 className="text-2xl text-[var(--theme-navy)]">{title}</h2><p className="mt-2 text-sm leading-relaxed text-[var(--theme-body)]">{body}</p></article>)}</div>
        <div className="mt-6 rounded-2xl border border-[var(--theme-border)] bg-white px-4 py-3 text-sm text-[var(--theme-body)]">Em caso de dúvidas, entre em contato pelo e-mail <Link className="underline underline-offset-2" href="mailto:suporte@cuidou.app">suporte@cuidou.app</Link>.</div>
        <p className="mt-4 text-xs leading-relaxed text-[var(--theme-muted)]">Minuta operacional sujeita a revisão jurídica antes da publicação em produção.</p>
      </section>
    </div></main>
  );
}
