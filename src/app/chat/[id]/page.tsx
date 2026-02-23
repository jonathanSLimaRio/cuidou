import { auth } from "@/auth";
import { AppShell } from "@/components/theme/app-shell";
import { CtaButton } from "@/components/theme/cta-button";
import { PageHeader } from "@/components/theme/page-header";
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

      <ChatRoom conversationId={conversation.id} currentUserId={session.user.id} />
    </AppShell>
  );
}
