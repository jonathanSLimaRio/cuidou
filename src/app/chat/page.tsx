import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
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
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Conversas</h1>
      <p className="mt-2 text-zinc-600">Chat com candidatos e famílias aprovados.</p>

      <ul className="mt-6 space-y-3">
        {conversations.length === 0 ? (
          <li className="rounded-lg border border-black/10 bg-white p-4 text-sm text-zinc-600">
            Nenhuma conversa ativa.
          </li>
        ) : (
          conversations.map((conversation) => {
            const counterpart =
              session.user.role === "FAMILY"
                ? conversation.professional
                : conversation.family;

            return (
              <li key={conversation.id} className="rounded-lg border border-black/10 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-zinc-900">
                      {counterpart.name ?? "Contato"} - {conversation.job.title}
                    </p>
                    <p className="text-sm text-zinc-600">
                      Última mensagem: {conversation.messages[0]?.content ?? "Sem mensagens"}
                    </p>
                  </div>
                  <Link
                    href={`/chat/${conversation.id}`}
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800"
                  >
                    Abrir
                  </Link>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </main>
  );
}
