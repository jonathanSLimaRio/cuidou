import { auth } from "@/auth";
import { AppShell } from "@/components/theme/app-shell";
import { CtaButton } from "@/components/theme/cta-button";
import { PageHeader } from "@/components/theme/page-header";
import { ReportAction } from "@/components/reports/report-action";
import { StatusBadge } from "@/components/theme/status-badge";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { ChatRoom } from "./room";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

export default async function ChatConversationPage({ params }: Params) {
  const { id } = await params;

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      familyId: true,
      professionalId: true,
      isBlockedByFamily: true,
      isBlockedByProfessional: true,
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
    },
  });

  if (!conversation) {
    redirect("/chat");
  }

  const canAccess =
    session.user.role === UserRole.ADMIN ||
    session.user.id === conversation.familyId ||
    session.user.id === conversation.professionalId;

  if (!canAccess) {
    redirect("/chat");
  }

  const counterpart =
    session.user.id === conversation.familyId ? conversation.professional : conversation.family;

  return (
    <AppShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Chat", href: "/chat" },
        { label: "Conversa" },
      ]}
    >
      <PageHeader
        eyebrow="Conversa"
        title={counterpart.name ?? "Contato"}
        description={`Vaga: ${conversation.job.title}`}
        actions={
          <>
            <StatusBadge tone="info">Canal privado</StatusBadge>
            <CtaButton href="/chat" variant="outline" icon={ArrowLeft}>
              Voltar
            </CtaButton>
          </>
        }
      />

      <section className="theme-card-soft rounded-3xl px-5 py-4">
        <p className="text-sm text-[var(--theme-body)]">
          Em caso de comportamento inadequado, voce pode denunciar esta conversa para moderacao.
        </p>
        <div className="mt-3">
          <ReportAction targetType="CONVERSATION" targetConversationId={conversation.id} />
        </div>
      </section>

      <ChatRoom
        conversationId={conversation.id}
        currentUserId={session.user.id}
        initialBlockedBySelf={
          session.user.id === conversation.familyId
            ? conversation.isBlockedByFamily
            : conversation.isBlockedByProfessional
        }
      />
    </AppShell>
  );
}
