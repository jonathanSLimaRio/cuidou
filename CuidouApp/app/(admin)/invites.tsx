import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { appTheme } from "@/constants/theme";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { LoadingBlock } from "@/src/components/ui/loading-block";
import { ScreenShell } from "@/src/components/ui/screen-shell";
import { useToast } from "@/src/hooks/use-toast";
import { ApiClientError } from "@/src/lib/api/client";
import { adminRepository } from "@/src/lib/api/admin-repository";

const EXPIRES_OPTIONS = [
  { label: "1 dia", value: 1 },
  { label: "7 dias", value: 7 },
  { label: "30 dias", value: 30 },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  return "Operação falhou. Tente novamente.";
}

export default function AdminInvitesScreen() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(7);

  const invitesQuery = useQuery({
    queryKey: ["admin-invites"],
    queryFn: () => adminRepository.listInvites(),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const trimmed = newEmail.trim();
      if (!trimmed) throw new Error("E-mail obrigatório");
      return adminRepository.createInvite(trimmed, expiresInDays);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-invites"] });
      toast.success("Convite criado", "O convite foi gerado com sucesso.");
      setShowCreate(false);
      setNewEmail("");
      setExpiresInDays(7);
    },
    onError: (error) => {
      toast.error("Erro ao criar convite", getErrorMessage(error));
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (inviteId: string) => adminRepository.revokeInvite(inviteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-invites"] });
      toast.success("Convite revogado", "O convite foi invalidado.");
    },
    onError: (error) => {
      toast.error("Erro ao revogar convite", getErrorMessage(error));
    },
  });

  function confirmRevoke(inviteId: string, email: string) {
    Alert.alert(
      "Revogar convite",
      `Deseja revogar o convite para ${email}? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Revogar",
          style: "destructive",
          onPress: () => revokeMutation.mutate(inviteId),
        },
      ],
    );
  }

  const items = invitesQuery.data?.items ?? [];
  const pending = items.filter((i) => !i.acceptedAt && new Date(i.expiresAt) > new Date());
  const accepted = items.filter((i) => i.acceptedAt);
  const expired = items.filter((i) => !i.acceptedAt && new Date(i.expiresAt) <= new Date());

  return (
    <ScreenShell
      title="Convites de admin"
      subtitle="Gerencie convites de acesso administrativo."
    >
      <Link href="/(admin)" asChild>
        <Button label="← Painel admin" variant="secondary" />
      </Link>

      <Button label="Criar convite" onPress={() => setShowCreate(true)} />

      {invitesQuery.isPending ? <LoadingBlock label="Carregando convites..." /> : null}

      {invitesQuery.isError ? (
        <ErrorState
          title="Falha ao carregar convites"
          description="Não foi possível buscar os convites."
          onRetry={() => invitesQuery.refetch()}
        />
      ) : null}

      {!invitesQuery.isPending && !invitesQuery.isError && items.length === 0 ? (
        <EmptyState
          title="Nenhum convite criado"
          description="Crie um convite para conceder acesso de administrador."
        />
      ) : null}

      {/* Pending invites */}
      {pending.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pendentes ({pending.length})</Text>
          {pending.map((invite) => (
            <View key={invite.id} style={styles.card}>
              <Text style={styles.emailText}>{invite.email}</Text>
              <Text style={styles.metaText}>
                Expira: {formatDate(invite.expiresAt)}
              </Text>
              <Text style={styles.tokenText} numberOfLines={1}>
                Token: {invite.token}
              </Text>
              <Button
                label="Revogar"
                variant="secondary"
                onPress={() => confirmRevoke(invite.id, invite.email)}
                loading={revokeMutation.isPending}
              />
            </View>
          ))}
        </View>
      ) : null}

      {/* Accepted invites */}
      {accepted.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aceitos ({accepted.length})</Text>
          {accepted.map((invite) => (
            <View key={invite.id} style={[styles.card, styles.cardAccepted]}>
              <Text style={styles.emailText}>{invite.email}</Text>
              <Text style={styles.metaText}>
                Aceito em: {formatDate(invite.acceptedAt!)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Expired invites */}
      {expired.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expirados ({expired.length})</Text>
          {expired.map((invite) => (
            <View key={invite.id} style={[styles.card, styles.cardExpired]}>
              <Text style={[styles.emailText, styles.textMuted]}>{invite.email}</Text>
              <Text style={styles.metaText}>
                Expirou: {formatDate(invite.expiresAt)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Create invite modal */}
      <Modal
        visible={showCreate}
        animationType="slide"
        transparent
        onRequestClose={() => !createMutation.isPending && setShowCreate(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => !createMutation.isPending && setShowCreate(false)}
        />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Criar convite</Text>

          <Text style={styles.fieldLabel}>E-mail do destinatário</Text>
          <TextInput
            style={styles.input}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="admin@exemplo.com"
            placeholderTextColor={appTheme.colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.fieldLabel}>Validade</Text>
          <View style={styles.chipRow}>
            {EXPIRES_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setExpiresInDays(opt.value)}
                style={[
                  styles.chip,
                  expiresInDays === opt.value && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    expiresInDays === opt.value && styles.chipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actionRow}>
            <Button
              label="Cancelar"
              variant="secondary"
              onPress={() => setShowCreate(false)}
              disabled={createMutation.isPending}
            />
            <Button
              label="Criar convite"
              onPress={() => createMutation.mutate()}
              loading={createMutation.isPending}
            />
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: appTheme.spacing.sm,
  },
  sectionTitle: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.md,
    fontWeight: appTheme.typography.weight.semibold,
  },
  card: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    padding: appTheme.spacing.md,
    gap: 6,
  },
  cardAccepted: {
    borderColor: "#86efac",
    backgroundColor: "rgba(34,197,94,0.05)",
  },
  cardExpired: {
    opacity: 0.6,
  },
  emailText: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.md,
    fontWeight: appTheme.typography.weight.semibold,
  },
  metaText: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.sm,
  },
  tokenText: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.xs,
    fontFamily: "monospace",
  },
  textMuted: {
    color: appTheme.colors.textMuted,
  },
  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: appTheme.radius.lg,
    borderTopRightRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.surface ?? appTheme.colors.white,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.sm,
  },
  sheetTitle: {
    color: appTheme.colors.navy,
    fontSize: appTheme.typography.size.xl,
    fontWeight: appTheme.typography.weight.bold,
  },
  fieldLabel: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.size.xs,
    textTransform: "uppercase",
    letterSpacing: 0.2,
    marginTop: appTheme.spacing.xs ?? 4,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.white,
    color: appTheme.colors.textStrong ?? appTheme.colors.navy,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    fontSize: appTheme.typography.size.md,
  },
  chipRow: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.full,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 8,
    backgroundColor: appTheme.colors.white,
  },
  chipActive: {
    borderColor: appTheme.colors.indigo,
    backgroundColor: "rgba(73,98,199,0.1)",
  },
  chipText: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.size.sm,
  },
  chipTextActive: {
    color: appTheme.colors.indigo,
    fontWeight: appTheme.typography.weight.semibold,
  },
  actionRow: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.xs ?? 4,
  },
});
