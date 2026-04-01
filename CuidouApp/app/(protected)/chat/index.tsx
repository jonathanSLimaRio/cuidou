import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { appTheme } from "@/constants/theme";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useAuth } from "@/src/hooks/use-auth";
import { chatRepository } from "@/src/lib/api/chat-repository";
import type { Conversation } from "@/src/lib/types/chat";

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function ConversationCard({ conversation, onPress }: { conversation: Conversation; onPress: () => void }) {
  const lastMessage = conversation.messages[0];
  const hasUnread = conversation.unreadCount > 0;

  return (
    <Pressable style={[styles.card, hasUnread && styles.cardUnread]} onPress={onPress}>
      <View style={styles.cardRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(conversation.counterpart.name ?? "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardName, hasUnread && styles.cardNameBold]} numberOfLines={1}>
              {conversation.counterpart.name ?? conversation.counterpart.email ?? "Usuário"}
            </Text>
            {lastMessage ? (
              <Text style={styles.cardTime}>{formatRelativeTime(lastMessage.createdAt)}</Text>
            ) : null}
          </View>
          <Text style={styles.cardJobTitle} numberOfLines={1}>
            {conversation.job.title}
          </Text>
          {lastMessage ? (
            <Text style={[styles.cardPreview, hasUnread && styles.cardPreviewBold]} numberOfLines={1}>
              {lastMessage.content}
            </Text>
          ) : (
            <Text style={styles.cardPreviewEmpty}>Sem mensagens ainda</Text>
          )}
        </View>
        {hasUnread ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ChatListScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const conversationsQuery = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => chatRepository.listConversations(),
    refetchInterval: 15_000,
    enabled: Boolean(user),
  });

  const conversations = conversationsQuery.data?.items ?? [];

  return (
    <ScreenShell title="Mensagens" subtitle="Conversas com familias e profissionais.">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={conversationsQuery.isFetching && !conversationsQuery.isLoading}
            onRefresh={() => conversationsQuery.refetch()}
          />
        }
      >
        {conversationsQuery.isLoading ? (
          <LoadingBlock label="Carregando conversas..." />
        ) : conversationsQuery.isError ? (
          <ErrorState
            title="Falha ao carregar"
            description="Nao foi possivel buscar suas conversas."
            onRetry={() => conversationsQuery.refetch()}
          />
        ) : conversations.length === 0 ? (
          <EmptyState
            title="Nenhuma conversa"
            description="Inicie uma conversa ao aceitar um convite ou candidatura."
          />
        ) : (
          <View style={styles.list}>
            {conversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                onPress={() =>
                  router.push(`/(protected)/chat/${conversation.id}` as never)
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: 2 },
  card: {
    backgroundColor: appTheme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
    paddingVertical: appTheme.spacing.md,
    paddingHorizontal: appTheme.spacing.sm,
  },
  cardUnread: { backgroundColor: "rgba(73,98,199,0.04)" },
  cardRow: { flexDirection: "row", alignItems: "center", gap: appTheme.spacing.sm },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: appTheme.colors.indigo,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  cardContent: { flex: 1, gap: 2 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardName: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.md,
    flex: 1,
  },
  cardNameBold: { fontWeight: appTheme.typography.weight.semibold },
  cardTime: { color: appTheme.colors.textMuted, fontSize: appTheme.typography.size.xs },
  cardJobTitle: { color: appTheme.colors.textMuted, fontSize: appTheme.typography.size.xs },
  cardPreview: { color: appTheme.colors.textMuted, fontSize: appTheme.typography.size.sm },
  cardPreviewBold: { color: appTheme.colors.text, fontWeight: "500" },
  cardPreviewEmpty: { color: appTheme.colors.textMuted, fontSize: appTheme.typography.size.sm, fontStyle: "italic" },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: appTheme.colors.indigo,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    flexShrink: 0,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});
