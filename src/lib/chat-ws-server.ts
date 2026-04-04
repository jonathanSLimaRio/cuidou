import type { IncomingMessage } from "node:http";
import type { Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { chatEvents } from "@/lib/chat-events";
import { prisma } from "@/lib/prisma";
import { verifyWsToken } from "@/lib/ws-token";
import type { NewMessagePayload } from "@/lib/chat-events";

type RoomSocket = WebSocket & {
  userId: string;
  conversationId: string;
};

/** conversationId → set of connected sockets in that room */
const rooms = new Map<string, Set<RoomSocket>>();

function parseUrlParams(req: IncomingMessage): URLSearchParams | null {
  try {
    const url = new URL(req.url ?? "", "http://localhost");
    return url.searchParams;
  } catch {
    return null;
  }
}

async function canAccessConversation(
  userId: string,
  role: string | null,
  conversationId: string,
): Promise<boolean> {
  if (role === "ADMIN") return true;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ familyId: userId }, { professionalId: userId }],
    },
    select: { id: true },
  });

  return conversation !== null;
}

export function setupWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    const params = parseUrlParams(req);
    const token = params?.get("token") ?? null;
    const conversationId = params?.get("conversationId") ?? null;

    if (!token || !conversationId) {
      ws.close(4001, "Missing token or conversationId");
      return;
    }

    const payload = verifyWsToken(token);

    if (!payload || payload.conversationId !== conversationId) {
      ws.close(4001, "Invalid or expired token");
      return;
    }

    const hasAccess = await canAccessConversation(payload.userId, payload.role, conversationId);
    if (!hasAccess) {
      ws.close(4003, "Access denied");
      return;
    }

    const socket = ws as RoomSocket;
    socket.userId = payload.userId;
    socket.conversationId = conversationId;

    // Join room
    if (!rooms.has(conversationId)) {
      rooms.set(conversationId, new Set());
    }
    rooms.get(conversationId)!.add(socket);

    const onNewMessage = (message: NewMessagePayload) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "new_message", conversationId, message }));
      }
    };
    chatEvents.on(`message:${conversationId}`, onNewMessage);

    ws.send(JSON.stringify({ type: "connected", conversationId }));

    ws.on("close", () => {
      rooms.get(conversationId)?.delete(socket);
      if (rooms.get(conversationId)?.size === 0) {
        rooms.delete(conversationId);
      }
      chatEvents.off(`message:${conversationId}`, onNewMessage);
    });

    ws.on("error", () => {
      rooms.get(conversationId)?.delete(socket);
      chatEvents.off(`message:${conversationId}`, onNewMessage);
    });
  });

  return wss;
}
