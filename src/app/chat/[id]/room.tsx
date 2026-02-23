"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { AppIcon } from "@/components/theme/app-icon";
import { Paperclip, Reply, SendHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type QuickReply = {
  key: string;
  text: string;
};

type Attachment = {
  id: string;
  fileName: string;
  sizeBytes: number;
  mimeType?: string;
  downloadUrl?: string;
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
  const { error: showError } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages?take=50`);
      const result = await response.json();

      if (!response.ok) {
        setLoadError(result.error ?? "Falha ao carregar mensagens.");
        return;
      }

      setLoadError(null);
      setMessages(result.items ?? []);
    } catch {
      setLoadError("Erro inesperado ao carregar mensagens.");
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
        showError("Falha ao enviar mensagem.", result.error);
        return;
      }

      setContent("");
      setFiles([]);
      await loadMessages();
    } catch {
      showError("Erro inesperado ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  }

  async function sendQuickReply(reply: QuickReply) {
    setSending(true);

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
        showError("Falha ao enviar resposta rápida.", result.error);
        return;
      }

      await loadMessages();
    } catch {
      showError("Erro inesperado ao enviar resposta rápida.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="theme-card rounded-[34px] p-4 sm:p-5">
      <div className="max-h-[56vh] space-y-3 overflow-y-auto rounded-2xl border border-[var(--theme-border)] bg-white/70 p-3 sm:max-h-[62vh]">
        {loading ? <p className="text-sm text-[var(--theme-muted)]">Carregando...</p> : null}

        {!loading && sortedMessages.length === 0 ? (
          <p className="text-sm text-[var(--theme-muted)]">Sem mensagens ainda.</p>
        ) : null}
        {loadError ? <p className="theme-alert theme-alert-danger">{loadError}</p> : null}

        {sortedMessages.map((message) => {
          const mine = message.senderId === currentUserId;
          return (
            <article
              key={message.id}
              className={`max-w-[90%] rounded-2xl px-3 py-2.5 shadow-[var(--theme-shadow-sm)] ${
                mine
                  ? "ml-auto border border-[var(--theme-indigo)]/35 bg-[var(--theme-indigo)] text-white"
                  : "mr-auto border border-[var(--theme-border)] bg-white text-[var(--theme-navy)]"
              }`}
            >
              <p className={`text-xs ${mine ? "text-white/80" : "text-[var(--theme-muted)]"}`}>
                {message.sender.name ?? "Usuário"}
              </p>
              <p className="mt-1 text-sm leading-relaxed">{message.content}</p>

              {message.attachments.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {message.attachments.map((attachment) => (
                    <li key={attachment.id}>
                      <a
                        href={attachment.downloadUrl || `/api/messages/attachments/${attachment.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs underline ${
                          mine ? "bg-white/15 text-white" : "bg-[var(--theme-cream)] text-[var(--theme-indigo)]"
                        }`}
                      >
                        <AppIcon icon={Paperclip} size="sm" />
                        {attachment.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="mt-3">
        <p className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Respostas rápidas</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {quickReplies.map((reply) => (
            <ActionButton
              key={reply.key}
              type="button"
              size="sm"
              icon={Reply}
              variant="secondary"
              disabled={sending}
              onClick={() => sendQuickReply(reply)}
              className="disabled:opacity-60"
            >
              {reply.text}
            </ActionButton>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 mt-4 space-y-2 rounded-2xl border border-[var(--theme-border)] bg-white/95 p-3 backdrop-blur">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Digite sua mensagem"
          className="theme-textarea"
        />

        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            className="w-full text-sm"
          />

          <ActionButton
            type="button"
            icon={SendHorizontal}
            disabled={sending}
            onClick={sendTextOrAttachments}
            className="w-full sm:w-auto disabled:opacity-60"
          >
            {sending ? "Enviando..." : "Enviar"}
          </ActionButton>
        </div>

        <p className="text-xs text-[var(--theme-muted)]">Máximo 3 anexos por mensagem, até 10MB cada.</p>

      </div>
    </section>
  );
}
