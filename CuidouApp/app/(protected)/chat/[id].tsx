import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { useAuth } from "@/src/hooks/use-auth";
import { useToast } from "@/src/hooks/use-toast";
import { chatRepository } from "@/src/lib/api/chat-repository";
import type { Message, QuickReply } from "@/src/lib/types/chat";

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
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const messagesQuery = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => chatRepository.getMessages(conversationId),
    enabled: Boolean(conversationId),
  });

  const quickRepliesQuery = useQuery({
    queryKey: ["quick-replies"],
    queryFn: () => chatRepository.getQuickReplies(),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (messagesQuery.data) {
      setAllMessages(messagesQuery.data.items);
      setNextCursor(messagesQuery.data.nextCursor);
    }
  }, [messagesQuery.data]);

  // Poll for new messages every 5s
  const poll = useCallback(async () => {
    if (!conversationId) return;
    try {
      const data = await chatRepository.getMessages(conversationId);
      setAllMessages(data.items);
    } catch {
      // silent
    }
  }, [conversationId]);

  useEffect(() => {
    pollingRef.current = setInterval(() => void poll(), 5_000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [poll]);

  async function loadMore() {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await chatRepository.getMessages(conversationId, nextCursor);
      setAllMessages((prev) => [...data.items, ...prev]);
      setNextCursor(data.nextCursor);
    } catch {
      toast.error("Erro", "Nao foi possivel carregar mensagens anteriores.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  const sendMutation = useMutation({
    mutationFn: (content: string) => chatRepository.sendMessage(conversationId, content),
    onSuccess: (data) => {
      setAllMessages((prev) => {
        const exists = prev.some((m) => m.id === data.message.id);
        if (exists) return prev;
        return [...prev, data.message];
      });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    },
    onError: () => {
      toast.error("Erro", "Nao foi possivel enviar a mensagem.");
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
      toast.error("Erro", "Nao foi possivel enviar resposta rapida.");
    },
  });

  function handleSend() {
    const text = inputText.trim();
    if (!text || sendMutation.isPending) return;
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
        description="Nao foi possivel carregar as mensagens desta conversa."
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
      </View>

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
              disabled={quickReplyMutation.isPending || sendMutation.isPending}
            >
              <Text style={styles.quickReplyText}>{qr.text}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Escreva uma mensagem..."
          placeholderTextColor={appTheme.colors.textMuted}
          multiline
          maxLength={2000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <Pressable
          style={[
            styles.sendButton,
            (!inputText.trim() || sendMutation.isPending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sendMutation.isPending}
        >
          <Text style={styles.sendButtonText}>↑</Text>
        </Pressable>
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
  },
  backButton: { paddingVertical: 4 },
  backButtonText: { color: appTheme.colors.indigo, fontSize: appTheme.typography.size.md },
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
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: appTheme.spacing.sm,
    padding: appTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.white,
  },
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
