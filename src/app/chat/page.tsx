import { auth } from "@/auth";
import { AppShell } from "@/components/theme/app-shell";
import { CtaButton } from "@/components/theme/cta-button";
import { EmptyState } from "@/components/theme/empty-state";
import { PageHeader } from "@/components/theme/page-header";
import { StatusBadge } from "@/components/theme/status-badge";
import { prisma } from "@/lib/prisma";
import { LayoutDashboard, MessageCircleMore, Search } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChatIndexPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.role) {
    redirect("/onboarding");
  }

  const where =
    session.user.role === "ADMIN"
      ? {}
      : session.user.role === "FAMILY"
        ? { familyId: session.user.id }
        : { professionalId: session.user.id };

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      job: {
        select: {
          title: true,
        },
      },
      family: {
        select: {
          id: true,
          name: true,
        },
      },
      professional: {
        select: {
          id: true,
          name: true,
        },
      },
      messages: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    take: 100,
  });

  return (
    <AppShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Chat" },
      ]}
    >
      <PageHeader
        eyebrow="Chat"
        title="Conversas ativas"
        description="Acompanhe mensagens com candidatos e famílias após aprovação de candidatura."
        actions={
          <>
            <CtaButton href="/dashboard" variant="outline" icon={LayoutDashboard}>
              Dashboard
            </CtaButton>
            <CtaButton href="/marketplace/jobs" icon={Search}>
              Ver vagas
            </CtaButton>
          </>
        }
      />

      {conversations.length === 0 ? (
          <EmptyState
            title="Nenhuma conversa ativa"
            description="As conversas aparecem aqui quando uma candidatura é aceita e o contato é liberado."
            action={
              <CtaButton href="/marketplace/jobs" icon={Search}>
                Explorar vagas
              </CtaButton>
            }
            icon="chat"
          />
        ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {conversations.map((conversation) => {
            const counterpart =
              session.user.role === "FAMILY" ? conversation.professional : conversation.family;

            return (
              <li key={conversation.id} className="theme-list-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge tone="blue">Conversa ativa</StatusBadge>
                  <StatusBadge tone="neutral">{conversation.messages.length} msg recente</StatusBadge>
                </div>

                <h2 className="mt-3 text-2xl leading-tight">
                  {counterpart.name ?? "Contato"}
                </h2>
                <p className="mt-1 text-sm text-[var(--theme-muted)]">Vaga: {conversation.job.title}</p>
                <p className="mt-3 line-clamp-2 text-sm text-[var(--theme-body)]">
                  Última mensagem: {conversation.messages[0]?.content ?? "Sem mensagens"}
                </p>

                <CtaButton
                  href={`/chat/${conversation.id}`}
                  className="mt-4"
                  icon={MessageCircleMore}
                >
                  Abrir conversa
                </CtaButton>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
