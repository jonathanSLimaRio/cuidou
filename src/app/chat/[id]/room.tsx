"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type QuickReply = {
  key: string;
  text: string;
};

type Attachment = {
  id: string;
  fileName: string;
  sizeBytes: number;
};

type Message = {
  id: string;
  content: string;
  senderId: string;
  kind: "TEXT" | "QUICK_REPLY" | "TEXT_WITH_ATTACHMENTS";
  createdAt: string;
  attachments: Attachment[];
  sender: {
    id: string;
    name: string | null;
  };
};

export function ChatRoom({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages?take=50`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Falha ao carregar mensagens.");
        return;
      }

      setMessages(result.items ?? []);
    } catch {
      setError("Erro inesperado ao carregar mensagens.");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const loadQuickReplies = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/quick-replies");
      const result = await response.json();
      if (response.ok) {
        setQuickReplies(result.items ?? []);
      }
    } catch {
      // No-op. Quick replies are optional in UI.
    }
  }, []);

  useEffect(() => {
    void loadMessages();
    void loadQuickReplies();

    const interval = setInterval(() => {
      void loadMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [conversationId, loadMessages, loadQuickReplies]);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages],
  );

  async function sendTextOrAttachments() {
    if (!content.trim() && files.length === 0) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      let response: Response;

      if (files.length > 0) {
        const formData = new FormData();
        formData.append("content", content);
        for (const file of files) {
          formData.append("attachments", file);
        }

        response = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
          }),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Falha ao enviar mensagem.");
        return;
      }

      setContent("");
      setFiles([]);
      await loadMessages();
    } catch {
      setError("Erro inesperado ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  }

  async function sendQuickReply(reply: QuickReply) {
    setSending(true);
    setError(null);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quickReplyKey: reply.key,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Falha ao enviar resposta rápida.");
        return;
      }

      await loadMessages();
    } catch {
      setError("Erro inesperado ao enviar resposta rápida.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-xl border border-black/10 bg-white p-4">
      <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-md border border-black/10 p-3">
        {loading ? <p className="text-sm text-zinc-500">Carregando...</p> : null}

        {!loading && sortedMessages.length === 0 ? (
          <p className="text-sm text-zinc-500">Sem mensagens ainda.</p>
        ) : null}

        {sortedMessages.map((message) => {
          const mine = message.senderId === currentUserId;
          return (
            <div
              key={message.id}
              className={`rounded-md px-3 py-2 ${
                mine ? "ml-8 bg-zinc-900 text-white" : "mr-8 bg-zinc-100 text-zinc-900"
              }`}
            >
              <p className="text-xs opacity-80">{message.sender.name ?? "Usuário"}</p>
              <p className="mt-1 text-sm">{message.content}</p>
              {message.attachments.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {message.attachments.map((attachment) => (
                    <li key={attachment.id}>
                      <a
                        href={`/api/messages/attachments/${attachment.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className={`text-xs underline ${mine ? "text-white" : "text-zinc-700"}`}
                      >
                        {attachment.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-3">
        <p className="text-xs text-zinc-600">Respostas rápidas</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {quickReplies.map((reply) => (
            <button
              key={reply.key}
              type="button"
              disabled={sending}
              onClick={() => sendQuickReply(reply)}
              className="rounded-md border border-black/10 bg-zinc-50 px-2 py-1 text-xs hover:bg-zinc-100 disabled:opacity-60"
            >
              {reply.text}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Digite sua mensagem"
          className="h-24 w-full rounded-md border border-black/10 p-2 text-sm"
        />

        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          className="w-full text-sm"
        />

        <p className="text-xs text-zinc-500">Máximo 3 anexos por mensagem, até 10MB cada.</p>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="button"
          disabled={sending}
          onClick={sendTextOrAttachments}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {sending ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </section>
  );
}
