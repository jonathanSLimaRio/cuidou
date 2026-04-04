import crypto from "node:crypto";

const SECRET = process.env.AUTH_SECRET ?? "development-secret-change-in-prod";

// Token is valid for 60 seconds — long enough to connect, short enough to limit exposure.
const TOKEN_TTL_MS = 60_000;

export type WsTokenPayload = {
  userId: string;
  role: string | null;
  conversationId: string;
  exp: number;
};

function sign(encoded: string): string {
  return crypto.createHmac("sha256", SECRET).update(encoded).digest("base64url");
}

export function createWsToken(
  userId: string,
  role: string | null,
  conversationId: string,
): string {
  const payload: WsTokenPayload = {
    userId,
    role,
    conversationId,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifyWsToken(token: string): WsTokenPayload | null {
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const encoded = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  const expectedSig = sign(encoded);

  try {
    if (
      signature.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
    ) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as WsTokenPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (!payload.userId || !payload.conversationId) return null;
    return payload;
  } catch {
    return null;
  }
}
