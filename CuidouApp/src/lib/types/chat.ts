export type MessageKind = "TEXT" | "QUICK_REPLY" | "TEXT_WITH_ATTACHMENTS";

export type Attachment = {
  id: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  downloadUrl: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  kind: MessageKind;
  createdAt: string;
  attachments: Attachment[];
  sender: {
    id: string;
    name: string | null;
  };
};

export type ConversationUser = {
  id: string;
  name: string | null;
  image: string | null;
  email: string | null;
  phone: string | null;
};

export type Conversation = {
  id: string;
  familyId: string;
  professionalId: string;
  unreadCount: number;
  family: ConversationUser;
  professional: ConversationUser;
  counterpart: ConversationUser;
  job: {
    id: string;
    title: string;
    serviceType: string;
  };
  messages: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  }[];
};

export type QuickReply = {
  key: string;
  text: string;
};

export type ConversationDetail = {
  id: string;
  familyId: string;
  professionalId: string;
  blockedBySelf: boolean;
  isBlockedByFamily: boolean;
  isBlockedByProfessional: boolean;
  job: { id: string; title: string; serviceType: string };
  family: ConversationUser;
  professional: ConversationUser;
  counterpart: ConversationUser;
};
