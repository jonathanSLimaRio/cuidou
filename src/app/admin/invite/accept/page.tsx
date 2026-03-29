import { auth } from "@/auth";
import { AppShell } from "@/components/theme/app-shell";
import { CtaButton } from "@/components/theme/cta-button";
import { PageHeader } from "@/components/theme/page-header";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { AcceptInviteForm } from "./accept-invite-form";

type SearchParams = Promise<{
  token?: string;
}>;

export default async function AdminInviteAcceptPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams.token?.trim() ?? "";

  const session = await auth();
  if (!session?.user) {
    const encodedNext = encodeURIComponent(`/admin/invite/accept?token=${encodeURIComponent(token)}`);
    redirect(`/login?next=${encodedNext}`);
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Convite admin" },
      ]}
    >
      <PageHeader
        eyebrow="Permissao"
        title="Aceitar convite de administrador"
        description="Valide seu token para concluir a promocao da conta para perfil ADMIN."
        actions={
          <CtaButton href="/dashboard" variant="outline" icon={ArrowLeft}>
            Voltar ao dashboard
          </CtaButton>
        }
      />

      <section className="theme-card rounded-[34px] px-6 py-7 sm:px-8">
        {!token ? (
          <p className="theme-alert theme-alert-danger">
            Token de convite nao informado na URL.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--theme-body)]">
              Sua conta autenticada precisa usar o mesmo e-mail para o qual o convite foi enviado.
            </p>
            <AcceptInviteForm token={token} />
          </div>
        )}
      </section>
    </AppShell>
  );
}
