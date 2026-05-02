export const ABLY_CHANNEL_PREFIX = "private:conversation";
export const ABLY_MESSAGE_EVENT = "new_message";

export function conversationChannelName(conversationId: string) {
  return `${ABLY_CHANNEL_PREFIX}:${conversationId}`;
}
