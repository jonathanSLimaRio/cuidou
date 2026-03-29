"use client";

import { useToast } from "@/components/notifications/use-toast";
import { ActionButton } from "@/components/theme/action-button";
import { AppIcon } from "@/components/theme/app-icon";
import { ArrowUp, Ban, Paperclip, Reply, SendHorizontal } from "lucide-react";
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

type MessagesPayload = {
  items?: Message[];
  nextCursor?: string | null;
  error?: string;
};

function mergeMessages(current: Message[], incoming: Message[]) {
  const byId = new Map<string, Message>();

  for (const message of current) {
    byId.set(message.id, message);
  }

  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function ChatRoom({
  conversationId,
  currentUserId,
  initialBlockedBySelf,
}: {
  conversationId: string;
  currentUserId: string;
  initialBlockedBySelf: boolean;
}) {
  const { error: showError, success } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [blockedBySelf, setBlockedBySelf] = useState(initialBlockedBySelf);
  const [updatingBlock, setUpdatingBlock] = useState(false);

  const loadLatestMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages?take=30`, {
        cache: "no-store",
      });
      const result = (await response.json()) as MessagesPayload;

      if (!response.ok) {
        setLoadError(result.error ?? "Falha ao carregar mensagens.");
        return;
      }

      setLoadError(null);
      setMessages((current) => mergeMessages(current, result.items ?? []));
      if (loading) {
        setNextCursor(result.nextCursor ?? null);
      }
    } catch {
      setLoadError("Erro inesperado ao carregar mensagens.");
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  }, [conversationId, loading]);

  const loadOlderMessages = useCallback(async () => {
    if (!nextCursor || loadingOlder) {
      return;
    }

    setLoadingOlder(true);
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages?take=30&cursor=${encodeURIComponent(nextCursor)}`,
        {
          cache: "no-store",
        },
      );
      const result = (await response.json()) as MessagesPayload;
      if (!response.ok) {
        showError("Falha ao carregar mensagens antigas.", result.error);
        return;
      }

      setMessages((current) => mergeMessages(current, result.items ?? []));
      setNextCursor(result.nextCursor ?? null);
    } catch {
      showError("Erro inesperado ao carregar mensagens antigas.");
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, loadingOlder, nextCursor, showError]);

  const loadQuickReplies = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/quick-replies", { cache: "no-store" });
      const result = await response.json();
      if (response.ok) {
        setQuickReplies(result.items ?? []);
      }
    } catch {
      // Quick replies are optional in UI.
    }
  }, []);

  useEffect(() => {
    void loadLatestMessages();
    void loadQuickReplies();

    const interval = setInterval(() => {
      void loadLatestMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadLatestMessages, loadQuickReplies]);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages],
  );

  async function sendTextOrAttachments() {
    if (!content.trim() && files.length === 0) {
      return;
    }

    if (blockedBySelf) {
      showError("Voce bloqueou esta conversa.");
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
      await loadLatestMessages();
    } catch {
      showError("Erro inesperado ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  }

  async function sendQuickReply(reply: QuickReply) {
    if (blockedBySelf) {
      showError("Voce bloqueou esta conversa.");
      return;
    }

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
        showError("Falha ao enviar resposta rapida.", result.error);
        return;
      }

      await loadLatestMessages();
    } catch {
      showError("Erro inesperado ao enviar resposta rapida.");
    } finally {
      setSending(false);
    }
  }

  async function toggleBlock() {
    setUpdatingBlock(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/block`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blocked: !blockedBySelf,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        showError("Falha ao atualizar bloqueio da conversa.", payload.error);
        return;
      }

      setBlockedBySelf(Boolean(payload.blockedBySelf));
      success(payload.blockedBySelf ? "Conversa bloqueada." : "Conversa desbloqueada.");
    } catch {
      showError("Erro inesperado ao atualizar bloqueio.");
    } finally {
      setUpdatingBlock(false);
    }
  }

  return (
    <section className="theme-card rounded-[34px] p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ActionButton
          type="button"
          size="sm"
          variant="secondary"
          icon={Ban}
          disabled={updatingBlock}
          onClick={toggleBlock}
        >
          {blockedBySelf ? "Desbloquear conversa" : "Bloquear conversa"}
        </ActionButton>
      </div>

      {blockedBySelf ? (
        <p className="theme-alert theme-alert-warning mb-3">
          Voce bloqueou esta conversa. Desbloqueie para voltar a enviar mensagens.
        </p>
      ) : null}

      <div className="max-h-[56vh] space-y-3 overflow-y-auto rounded-2xl border border-[var(--theme-border)] bg-white/70 p-3 sm:max-h-[62vh]">
        {loading ? <p className="text-sm text-[var(--theme-muted)]">Carregando...</p> : null}

        {!loading && nextCursor ? (
          <div className="flex justify-center">
            <ActionButton
              type="button"
              size="sm"
              variant="secondary"
              icon={ArrowUp}
              disabled={loadingOlder}
              onClick={loadOlderMessages}
            >
              {loadingOlder ? "Carregando..." : "Carregar mensagens antigas"}
            </ActionButton>
          </div>
        ) : null}

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
                {message.sender.name ?? "Usuario"}
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
        <p className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Respostas rapidas</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {quickReplies.map((reply) => (
            <ActionButton
              key={reply.key}
              type="button"
              size="sm"
              icon={Reply}
              variant="secondary"
              disabled={sending || blockedBySelf}
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
          disabled={blockedBySelf}
        />

        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            className="w-full text-sm"
            disabled={blockedBySelf}
          />

          <ActionButton
            type="button"
            icon={SendHorizontal}
            disabled={sending || blockedBySelf}
            onClick={sendTextOrAttachments}
            className="w-full sm:w-auto disabled:opacity-60"
          >
            {sending ? "Enviando..." : "Enviar"}
          </ActionButton>
        </div>

        <p className="text-xs text-[var(--theme-muted)]">Maximo 3 anexos por mensagem, ate 10MB cada.</p>
      </div>
    </section>
  );
}
