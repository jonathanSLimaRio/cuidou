import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import Link from "next/link";
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
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Conversa</h1>
          <p className="text-sm text-zinc-600">
            {counterpart.name ?? "Contato"} - {conversation.job.title}
          </p>
        </div>
        <Link href="/chat" className="rounded-md border border-black/10 px-3 py-1.5 text-sm">
          Voltar
        </Link>
      </div>

      <ChatRoom conversationId={conversation.id} currentUserId={session.user.id} />
    </main>
  );
}
