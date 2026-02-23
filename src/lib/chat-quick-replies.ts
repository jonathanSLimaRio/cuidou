import { UserRole } from "@prisma/client";

export type QuickReply = {
  key: string;
  text: string;
};

const QUICK_REPLIES: Record<"FAMILY" | "PROFESSIONAL", QuickReply[]> = {
  FAMILY: [
    { key: "family_call_request", text: "Pode me ligar quando tiver um tempo?" },
    { key: "family_availability", text: "Qual sua disponibilidade esta semana?" },
    { key: "family_docs", text: "Você consegue compartilhar seus documentos no chat?" },
    { key: "family_next_step", text: "Vamos seguir para a próxima etapa da contratação." },
  ],
  PROFESSIONAL: [
    { key: "pro_interest", text: "Tenho interesse na vaga e estou disponível para conversar." },
    { key: "pro_start_next_week", text: "Posso começar na próxima semana." },
    { key: "pro_shift_options", text: "Tenho disponibilidade nos turnos de manhã e tarde." },
    { key: "pro_profile_complete", text: "Meu perfil e documentos já estão atualizados na plataforma." },
  ],
};

export function getQuickRepliesForRole(role: UserRole | null | undefined): QuickReply[] {
  if (role === UserRole.FAMILY) {
    return QUICK_REPLIES.FAMILY;
  }

  if (role === UserRole.PROFESSIONAL) {
    return QUICK_REPLIES.PROFESSIONAL;
  }

  if (role === UserRole.ADMIN) {
    return [...QUICK_REPLIES.FAMILY, ...QUICK_REPLIES.PROFESSIONAL];
  }

  return [];
}

export function resolveQuickReply(
  role: UserRole | null | undefined,
  quickReplyKey: string,
): QuickReply | null {
  const quickReplies = getQuickRepliesForRole(role);
  return quickReplies.find((item) => item.key === quickReplyKey) ?? null;
}
