/**
 * Custom Next.js server with integrated WebSocket support for real-time chat.
 *
 * Usage:
 *   Development:  npx tsx server.ts
 *   Production:   NODE_ENV=production npx tsx server.ts
 */
import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { setupWebSocketServer } from "./src/lib/chat-ws-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST ?? "localhost";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url ?? "/", true);
      void handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  setupWebSocketServer(server);

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server active on ws://${hostname}:${port}/ws`);
  });
});
