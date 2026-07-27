export const ABLY_MESSAGE_EVENT = "new_message";

export function conversationChannelName(conversationId: string) {
  return `private:conversation:${conversationId}`;
}
