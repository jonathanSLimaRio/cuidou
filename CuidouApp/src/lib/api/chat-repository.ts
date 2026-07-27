import * as DocumentPicker from "expo-document-picker";
import type { TokenRequest } from "ably";

import { apiRequest } from "@/src/lib/api/client";
import type { Conversation, ConversationDetail, Message, QuickReply } from "@/src/lib/types/chat";

export const chatRepository = {
  async listConversations(): Promise<{ items: Conversation[] }> {
    return apiRequest<{ items: Conversation[] }>("/api/conversations", {
      method: "GET",
      auth: true,
    });
  },

  async getConversation(conversationId: string): Promise<ConversationDetail> {
    return apiRequest<ConversationDetail>(`/api/conversations/${conversationId}`, {
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

  async sendMessageWithAttachment(
    conversationId: string,
    content: string,
    file: DocumentPicker.DocumentPickerAsset,
  ): Promise<{ message: Message }> {
    const formData = new FormData();
    formData.append("content", content);
    formData.append("attachments", {
      uri: file.uri,
      name: file.name ?? "attachment",
      type: file.mimeType ?? "application/octet-stream",
    } as unknown as Blob);

    return apiRequest<{ message: Message }>(
      `/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        auth: true,
        body: formData,
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
    blocked: boolean,
  ): Promise<{ blockedBySelf: boolean }> {
    return apiRequest<{ blockedBySelf: boolean }>(
      `/api/conversations/${conversationId}/block`,
      {
        method: "PATCH",
        auth: true,
        json: { blocked },
      },
    );
  },

  async getRealtimeToken(conversationId: string): Promise<{ tokenRequest: TokenRequest }> {
    return apiRequest<{ tokenRequest: TokenRequest }>("/api/ws-token", {
      method: "GET",
      auth: true,
      query: { conversationId },
    });
  },
};
