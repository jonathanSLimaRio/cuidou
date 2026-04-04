import { EventEmitter } from "node:events";

// Use a global singleton so the EventEmitter survives Next.js hot-module reloads in development.
declare global {
  // eslint-disable-next-line no-var
  var __chatEvents: EventEmitter | undefined;
}

const chatEvents: EventEmitter = global.__chatEvents ?? new EventEmitter();
global.__chatEvents = chatEvents;
chatEvents.setMaxListeners(200);

export { chatEvents };

export type NewMessagePayload = Record<string, unknown>;

/** Broadcast a new message to all WebSocket clients in a conversation room. */
export function emitNewMessage(conversationId: string, message: NewMessagePayload): void {
  chatEvents.emit(`message:${conversationId}`, message);
}
