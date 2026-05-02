import { Rest } from "ably";
import { getRequiredProductionEnv } from "@/lib/env";
import { ABLY_MESSAGE_EVENT, conversationChannelName } from "@/lib/realtime";

let ablyRest: Rest | null = null;

function getAblyRest() {
  if (!ablyRest) {
    ablyRest = new Rest(getRequiredProductionEnv("ABLY_API_KEY", "dev-placeholder-key"));
  }

  return ablyRest;
}

export async function createConversationTokenRequest(userId: string, conversationId: string) {
  const channelName = conversationChannelName(conversationId);

  return getAblyRest().auth.createTokenRequest({
    clientId: userId,
    ttl: 60 * 60 * 1000,
    capability: JSON.stringify({
      [channelName]: ["subscribe"],
    }),
  });
}

export async function publishConversationMessage(
  conversationId: string,
  message: Record<string, unknown>,
) {
  const channelName = conversationChannelName(conversationId);
  await getAblyRest().channels.get(channelName).publish(ABLY_MESSAGE_EVENT, {
    conversationId,
    message,
  });
}
