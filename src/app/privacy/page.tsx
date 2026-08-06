import { CtaButton } from "@/components/theme/cta-button";
import { PageHeader } from "@/components/theme/page-header";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade | Cuidou",
  description: "Como a Cuidou trata e protege dados pessoais.",
};

const sections = [
  ["1. Controlador e contato", "A Cuidou é responsável pelas decisões sobre o tratamento de dados pessoais realizado na plataforma. Solicitações de titulares e contatos com o encarregado podem ser enviados para privacidade@cuidou.app. A identificação empresarial e o endereço do controlador deverão ser confirmados pela revisão jurídica antes do lançamento em produção."],
  ["2. Dados tratados", "Tratamos dados cadastrais e de contato, autenticação, perfis profissionais e familiares, localização aproximada, disponibilidade, vagas, candidaturas, contratos, mensagens, avaliações, denúncias, documentos de verificação, registros de segurança, consentimentos e dados técnicos do dispositivo. Não solicitamos dados de saúde além do estritamente necessário ao contexto informado pelo próprio usuário."],
  ["3. Finalidades e bases legais", "Os dados são usados para criar e proteger contas, operar o marketplace, permitir comunicação e contratação direta, verificar profissionais, moderar conteúdo, prevenir fraude, enviar comunicações transacionais, cumprir obrigações legais, exercer direitos e melhorar o serviço. As bases legais incluem execução de contrato ou procedimentos preliminares, obrigação legal, exercício regular de direitos, legítimo interesse avaliado e consentimento quando exigido."],
  ["4. Compartilhamento e operadores", "Compartilhamos somente os dados necessários com provedores de hospedagem e banco, autenticação, monitoramento, comunicação em tempo real, e-mail, notificações push e armazenamento de arquivos. A arquitetura prevê Vercel, PostgreSQL/Prisma, Google, Ably, Resend, Expo, Sentry, Upstash e WordPress. A lista final de suboperadores e suas localidades será validada antes da produção."],
  ["5. Transferências internacionais", "Alguns provedores podem processar dados fora do Brasil. Nesses casos, a Cuidou adotará mecanismos permitidos pela LGPD, obrigações contratuais de proteção e avaliação dos fornecedores. A relação definitiva de países e garantias depende da configuração produtiva aprovada."],
  ["6. Retenção e eliminação", "Os dados são mantidos enquanto a conta estiver ativa e pelo período necessário para segurança, prevenção a fraude, resolução de disputas e obrigações legais. Documentos de verificação, mensagens, auditoria e contratos terão prazos específicos definidos na política interna de retenção. Após o prazo aplicável, os dados serão eliminados ou anonimizados."],
  ["7. Segurança e incidentes", "Aplicamos controle de acesso por função, criptografia em trânsito, armazenamento seguro de credenciais, limitação de requisições, logs de auditoria, monitoramento e revisão de documentos. Incidentes relevantes serão investigados, contidos e comunicados aos titulares e à ANPD quando a legislação exigir."],
  ["8. Crianças e adolescentes", "A plataforma é destinada a adultos responsáveis e profissionais maiores de idade. Dados sobre crianças ou pessoas cuidadas devem ser limitados ao necessário para descrever a oportunidade, sem documentos, diagnósticos ou detalhes excessivos. Contas de menores não são permitidas."],
  ["9. Direitos do titular", "O titular pode solicitar confirmação e acesso, correção, anonimização, bloqueio ou eliminação quando aplicável, informação sobre compartilhamentos, portabilidade, revisão de decisões automatizadas, oposição e revogação de consentimento. A identidade poderá ser verificada antes do atendimento para proteger a conta."],
  ["10. Atualizações e histórico de aceite", "Alterações materiais serão apresentadas novamente ao usuário. A Cuidou registra a versão e a data dos Termos e da Política aceitos. A versão atual é 2026-08-06."],
] as const;

export default function PrivacyPage() {
  return (
    <main id="main-content" className="theme-page">
      <div className="theme-container space-y-6">
        <PageHeader eyebrow="Legal" title="Política de Privacidade" description="Como a Cuidou coleta, usa e protege dados pessoais." breadcrumbs={[{ label: "Home", href: "/" }, { label: "Política de Privacidade" }]} actions={<CtaButton href="/" variant="outline" icon={ArrowLeft}>Voltar para home</CtaButton>} />
        <section className="theme-card rounded-[34px] px-6 py-7 sm:px-8">
          <p className="text-sm text-[var(--theme-muted)]">Última atualização: 06/08/2026 · Versão 2026-08-06</p>
          <div className="mt-5 space-y-5">
            {sections.map(([title, body]) => <article key={title} className="theme-list-card p-5"><h2 className="text-2xl text-[var(--theme-navy)]">{title}</h2><p className="mt-2 text-sm leading-relaxed text-[var(--theme-body)]">{body}</p></article>)}
          </div>
          <div className="mt-6 rounded-2xl border border-[var(--theme-border)] bg-white px-4 py-3 text-sm text-[var(--theme-body)]">Solicitações relacionadas à privacidade podem ser enviadas para <Link className="underline underline-offset-2" href="mailto:privacidade@cuidou.app">privacidade@cuidou.app</Link>.</div>
          <p className="mt-4 text-xs leading-relaxed text-[var(--theme-muted)]">Minuta operacional sujeita a revisão jurídica antes da publicação em produção.</p>
        </section>
      </div>
    </main>
  );
}
