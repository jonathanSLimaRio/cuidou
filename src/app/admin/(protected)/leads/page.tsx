import { PageHeader } from "@/components/theme/page-header";
import { StatusBadge } from "@/components/theme/status-badge";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const leads = await prisma.waitlistLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, email: true, name: true, role: true, city: true, source: true, consentAt: true, createdAt: true },
  });

  return (
    <>
      <PageHeader
        eyebrow="Comercial"
        title="Leads da lista de espera"
        description="Contatos que autorizaram receber novidades e podem ser priorizados para o piloto regional."
      />
      <section className="theme-card rounded-[28px] p-5 sm:p-7">
        {leads.length === 0 ? (
          <p className="theme-card-soft rounded-xl px-4 py-3 text-sm text-[var(--theme-muted)]">Nenhum lead capturado ainda.</p>
        ) : (
          <div className="theme-table-wrap">
            <table className="theme-table min-w-[720px]">
              <thead><tr><th>E-mail</th><th>Nome</th><th>Papel</th><th>Cidade</th><th>Origem</th><th>Cadastro</th></tr></thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="font-medium">{lead.email}</td>
                    <td>{lead.name ?? "—"}</td>
                    <td>{lead.role ? <StatusBadge tone="blue">{lead.role}</StatusBadge> : "—"}</td>
                    <td>{lead.city ?? "—"}</td>
                    <td>{lead.source}</td>
                    <td>{lead.createdAt.toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
