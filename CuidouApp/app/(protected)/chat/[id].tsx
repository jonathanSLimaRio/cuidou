import * as DocumentPicker from "expo-document-picker";
import { Realtime, type Message as AblyMessage, type TokenRequest } from "ably";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ReportAction } from "@/src/components/marketplace/report-action";
import { useAuth } from "@/src/hooks/use-auth";
import { useToast } from "@/src/hooks/use-toast";
import { chatRepository } from "@/src/lib/api/chat-repository";
import { ABLY_MESSAGE_EVENT, conversationChannelName } from "@/src/lib/realtime";
import type { Message, QuickReply } from "@/src/lib/types/chat";

type RealtimeStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  const byId = new Map<string, Message>();
  for (const m of current) byId.set(m.id, m);
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <View style={[styles.bubbleWrapper, isOwn ? styles.bubbleWrapperOwn : styles.bubbleWrapperOther]}>
      {!isOwn ? (
        <Text style={styles.senderName}>{message.sender.name ?? "Usuário"}</Text>
      ) : null}
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther]}>
          {message.content}
        </Text>
        {message.attachments.length > 0 ? (
          <View style={styles.attachmentList}>
            {message.attachments.map((att) => (
              <Text key={att.id} style={styles.attachmentName}>
                📎 {att.fileName}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
      <Text style={styles.bubbleTime}>
        {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
}

export default function ChatRoomScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);

  const [inputText, setInputText] = useState("");
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [blockedBySelf, setBlockedBySelf] = useState(false);

  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("connecting");
  const realtimeRef = useRef<Realtime | null>(null);
  const unmountedRef = useRef(false);

  // Fetch initial messages via React Query
  const messagesQuery = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => chatRepository.getMessages(conversationId),
    enabled: Boolean(conversationId),
  });

  useEffect(() => {
    if (messagesQuery.data) {
      setAllMessages(messagesQuery.data.items);
      setNextCursor(messagesQuery.data.nextCursor);
    }
  }, [messagesQuery.data]);

  // Fetch conversation detail for initial block state
  const conversationQuery = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => chatRepository.getConversation(conversationId),
    enabled: Boolean(conversationId),
  });

  useEffect(() => {
    if (conversationQuery.data) {
      setBlockedBySelf(conversationQuery.data.blockedBySelf);
    }
  }, [conversationQuery.data]);

  // Quick replies
  const quickRepliesQuery = useQuery({
    queryKey: ["quick-replies"],
    queryFn: () => chatRepository.getQuickReplies(),
    staleTime: 5 * 60_000,
  });

  // Ably owns reconnect/backoff; the app only reflects the connection state.
  useEffect(() => {
    unmountedRef.current = false;
    if (!conversationId) return;

    const realtime = new Realtime({
      authCallback: async (_tokenParams, callback) => {
        try {
          const response = await chatRepository.getRealtimeToken(conversationId);
          callback(null, response.tokenRequest as TokenRequest);
        } catch (error) {
          callback(error instanceof Error ? error.message : "Falha ao obter token do chat", null);
        }
      },
    });

    realtime.connection.on((stateChange) => {
      if (unmountedRef.current) return;

      if (stateChange.current === "connected") {
        setRealtimeStatus("connected");
      } else if (stateChange.current === "failed" || stateChange.current === "closed") {
        setRealtimeStatus("disconnected");
      } else if (stateChange.current === "disconnected" || stateChange.current === "suspended") {
        setRealtimeStatus("reconnecting");
      } else {
        setRealtimeStatus("connecting");
      }
    });

    const channel = realtime.channels.get(conversationChannelName(conversationId));
    const onMessage = (event: AblyMessage) => {
      const data = event.data as {
        conversationId?: string;
        message?: Message;
      };

      if (data.conversationId === conversationId && data.message) {
        setAllMessages((current) => mergeMessages(current, [data.message!]));
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
      }
    };

    void channel.subscribe(ABLY_MESSAGE_EVENT, onMessage);
    realtimeRef.current = realtime;

    return () => {
      unmountedRef.current = true;
      void channel.unsubscribe(ABLY_MESSAGE_EVENT, onMessage);
      realtime.close();
      realtimeRef.current = null;
    };
  }, [conversationId]);

  async function loadMore() {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await chatRepository.getMessages(conversationId, nextCursor);
      setAllMessages((prev) => [...data.items, ...prev]);
      setNextCursor(data.nextCursor);
    } catch {
      toast.error("Erro", "Não foi possível carregar mensagens anteriores.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (selectedFile) {
        return chatRepository.sendMessageWithAttachment(conversationId, content, selectedFile);
      }
      return chatRepository.sendMessage(conversationId, content);
    },
    onSuccess: (data) => {
      setAllMessages((prev) => {
        const exists = prev.some((m) => m.id === data.message.id);
        if (exists) return prev;
        return [...prev, data.message];
      });
      setSelectedFile(null);
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    },
    onError: () => {
      toast.error("Erro", "Não foi possível enviar a mensagem.");
    },
  });

  const quickReplyMutation = useMutation({
    mutationFn: (key: string) => chatRepository.sendQuickReply(conversationId, key),
    onSuccess: (data) => {
      setAllMessages((prev) => {
        const exists = prev.some((m) => m.id === data.message.id);
        if (exists) return prev;
        return [...prev, data.message];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    },
    onError: () => {
      toast.error("Erro", "Não foi possível enviar resposta rápida.");
    },
  });

  const blockMutation = useMutation({
    mutationFn: () => chatRepository.blockConversation(conversationId, !blockedBySelf),
    onSuccess: (data) => {
      setBlockedBySelf(data.blockedBySelf);
      if (data.blockedBySelf) {
        toast.success("Conversa bloqueada", "Você não receberá mais mensagens.");
      } else {
        toast.success("Conversa desbloqueada", "Você pode enviar mensagens novamente.");
      }
    },
    onError: () => {
      toast.error("Erro", "Não foi possível atualizar o bloqueio.");
    },
  });

  async function chooseFile() {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      setSelectedFile(result.assets[0]);
    }
  }

  function handleSend() {
    const text = inputText.trim();
    if ((!text && !selectedFile) || sendMutation.isPending) return;
    if (blockedBySelf) {
      toast.warning("Bloqueado", "Desbloqueie a conversa para enviar mensagens.");
      return;
    }
    setInputText("");
    sendMutation.mutate(text);
  }

  const quickReplies: QuickReply[] = quickRepliesQuery.data?.items ?? [];

  if (messagesQuery.isLoading) {
    return <LoadingBlock label="Carregando mensagens..." />;
  }

  if (messagesQuery.isError) {
    return (
      <ErrorState
        title="Falha ao carregar"
        description="Não foi possível carregar as mensagens desta conversa."
        onRetry={() => messagesQuery.refetch()}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </Pressable>
        <Text style={styles.realtimeStatus}>
          {realtimeStatus === "connected"
            ? "Ao vivo"
            : realtimeStatus === "reconnecting"
              ? "Reconectando..."
              : realtimeStatus === "disconnected"
                ? "Offline"
                : "Conectando..."}
        </Text>
        <View style={styles.headerActions}>
          <Button
            label={blockedBySelf ? "Desbloquear" : "Bloquear"}
            variant="ghost"
            onPress={() => blockMutation.mutate()}
            loading={blockMutation.isPending}
          />
          <ReportAction
            label="Denunciar"
            targetType="CONVERSATION"
            targetConversationId={conversationId}
          />
        </View>
      </View>

      {blockedBySelf ? (
        <View style={styles.blockedBanner}>
          <Text style={styles.blockedBannerText}>
            Você bloqueou esta conversa. Desbloqueie para enviar mensagens.
          </Text>
        </View>
      ) : null}

      {/* Load more */}
      {nextCursor ? (
        <Button
          label={isLoadingMore ? "Carregando..." : "Ver mensagens anteriores"}
          variant="secondary"
          disabled={isLoadingMore}
          onPress={() => void loadMore()}
        />
      ) : null}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={allMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble message={item} isOwn={item.senderId === user?.id} />
        )}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma mensagem ainda. Comece a conversa!</Text>
        }
      />

      {/* Quick replies */}
      {quickReplies.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickRepliesScroll}
          contentContainerStyle={styles.quickRepliesContent}
        >
          {quickReplies.map((qr) => (
            <Pressable
              key={qr.key}
              style={styles.quickReplyChip}
              onPress={() => quickReplyMutation.mutate(qr.key)}
              disabled={quickReplyMutation.isPending || sendMutation.isPending || blockedBySelf}
            >
              <Text style={styles.quickReplyText}>{qr.text}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {/* Input area */}
      <View style={styles.inputArea}>
        {selectedFile ? (
          <View style={styles.filePreview}>
            <Text style={styles.filePreviewText} numberOfLines={1}>
              📎 {selectedFile.name ?? "arquivo"}
            </Text>
            <Pressable onPress={() => setSelectedFile(null)}>
              <Text style={styles.filePreviewRemove}>✕</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.inputRow}>
          <Pressable
            style={[styles.attachButton, blockedBySelf && styles.attachButtonDisabled]}
            onPress={() => void chooseFile()}
            disabled={blockedBySelf || sendMutation.isPending}
          >
            <Text style={styles.attachButtonText}>📎</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={blockedBySelf ? "Conversa bloqueada" : "Escreva uma mensagem..."}
            placeholderTextColor={appTheme.colors.textMuted}
            multiline
            maxLength={2000}
            returnKeyType="send"
            editable={!blockedBySelf}
            onSubmitEditing={handleSend}
          />
          <Pressable
            style={[
              styles.sendButton,
              ((!inputText.trim() && !selectedFile) || sendMutation.isPending || blockedBySelf) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={(!inputText.trim() && !selectedFile) || sendMutation.isPending || blockedBySelf}
          >
            <Text style={styles.sendButtonText}>↑</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: appTheme.colors.background ?? "#f8f7f4" },
  header: {
    backgroundColor: appTheme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: { paddingVertical: 4 },
  backButtonText: { color: appTheme.colors.indigo, fontSize: appTheme.typography.size.md },
  realtimeStatus: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.xs,
    flex: 1,
    textAlign: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  blockedBanner: {
    backgroundColor: "#fef3c7",
    borderBottomWidth: 1,
    borderBottomColor: "#fcd34d",
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  blockedBannerText: {
    color: "#92400e",
    fontSize: appTheme.typography.size.sm,
  },
  messageList: {
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.sm,
    flexGrow: 1,
  },
  bubbleWrapper: { maxWidth: "80%", gap: 2 },
  bubbleWrapperOwn: { alignSelf: "flex-end", alignItems: "flex-end" },
  bubbleWrapperOther: { alignSelf: "flex-start", alignItems: "flex-start" },
  senderName: {
    fontSize: appTheme.typography.size.xs,
    color: appTheme.colors.textMuted,
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  bubbleOwn: { backgroundColor: appTheme.colors.indigo },
  bubbleOther: {
    backgroundColor: appTheme.colors.white,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  bubbleText: { fontSize: appTheme.typography.size.md, lineHeight: 20 },
  bubbleTextOwn: { color: "#fff" },
  bubbleTextOther: { color: appTheme.colors.navy },
  bubbleTime: {
    fontSize: 10,
    color: appTheme.colors.textMuted,
    marginTop: 2,
  },
  attachmentList: { gap: 2, marginTop: 4 },
  attachmentName: { fontSize: appTheme.typography.size.xs, color: "rgba(255,255,255,0.8)" },
  emptyText: {
    textAlign: "center",
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
    marginTop: 40,
  },
  quickRepliesScroll: { maxHeight: 48 },
  quickRepliesContent: {
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    gap: appTheme.spacing.sm,
  },
  quickReplyChip: {
    borderWidth: 1,
    borderColor: appTheme.colors.indigo,
    borderRadius: appTheme.radius.full,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 6,
    backgroundColor: "rgba(73,98,199,0.06)",
  },
  quickReplyText: {
    color: appTheme.colors.indigo,
    fontSize: appTheme.typography.size.sm,
  },
  inputArea: {
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.white,
    paddingHorizontal: appTheme.spacing.sm,
    paddingTop: appTheme.spacing.sm,
    paddingBottom: appTheme.spacing.sm,
    gap: 6,
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(73,98,199,0.08)",
    borderRadius: appTheme.radius.md,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 6,
  },
  filePreviewText: {
    flex: 1,
    color: appTheme.colors.indigo,
    fontSize: appTheme.typography.size.sm,
  },
  filePreviewRemove: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.md,
    paddingHorizontal: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: appTheme.spacing.sm,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: appTheme.radius.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface ?? appTheme.colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  attachButtonDisabled: { opacity: 0.4 },
  attachButtonText: { fontSize: 20 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    fontSize: appTheme.typography.size.md,
    color: appTheme.colors.navy,
    backgroundColor: appTheme.colors.white,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: appTheme.colors.indigo,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.45 },
  sendButtonText: { color: "#fff", fontSize: 20, fontWeight: "700" },
});
