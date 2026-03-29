import { auth } from "@/auth";
import { AppShell } from "@/components/theme/app-shell";
import { CtaButton } from "@/components/theme/cta-button";
import { PageHeader } from "@/components/theme/page-header";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { NotificationsCenter } from "./notifications-center";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Notificacoes" },
      ]}
    >
      <PageHeader
        eyebrow="Comunicacao"
        title="Notificacoes da conta"
        description="Acompanhe atualizacoes de convites, contratos, chat, moderacao e sistema."
        actions={
          <CtaButton href="/dashboard" variant="outline" icon={ArrowLeft}>
            Voltar ao dashboard
          </CtaButton>
        }
      />

      <NotificationsCenter />
    </AppShell>
  );
}
