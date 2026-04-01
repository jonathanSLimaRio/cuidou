import { apiRequest } from "@/src/lib/api/client";
import type { Conversation, Message, QuickReply } from "@/src/lib/types/chat";

export const chatRepository = {
  async listConversations(): Promise<{ items: Conversation[] }> {
    return apiRequest<{ items: Conversation[] }>("/api/conversations", {
      method: "GET",
      auth: true,
    });
  },

  async getMessages(
    conversationId: string,
    cursor?: string,
  ): Promise<{ items: Message[]; nextCursor: string | null }> {
    return apiRequest<{ items: Message[]; nextCursor: string | null }>(
      `/api/conversations/${conversationId}/messages`,
      {
        method: "GET",
        auth: true,
        query: { cursor: cursor ?? undefined, limit: 30 },
      },
    );
  },

  async sendMessage(
    conversationId: string,
    content: string,
  ): Promise<{ message: Message }> {
    return apiRequest<{ message: Message }>(
      `/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        auth: true,
        json: { content, kind: "TEXT" },
      },
    );
  },

  async sendQuickReply(
    conversationId: string,
    quickReplyKey: string,
  ): Promise<{ message: Message }> {
    return apiRequest<{ message: Message }>(
      `/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        auth: true,
        json: { content: quickReplyKey, kind: "QUICK_REPLY" },
      },
    );
  },

  async getQuickReplies(): Promise<{ items: QuickReply[] }> {
    return apiRequest<{ items: QuickReply[] }>("/api/chat/quick-replies", {
      method: "GET",
      auth: true,
    });
  },

  async blockConversation(
    conversationId: string,
    block: boolean,
  ): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(
      `/api/conversations/${conversationId}/block`,
      {
        method: "POST",
        auth: true,
        json: { block },
      },
    );
  },
};
