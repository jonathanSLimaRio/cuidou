import { describe, expect, it, vi } from "vitest";

const ablyMocks = vi.hoisted(() => ({
  createTokenRequest: vi.fn(),
}));

vi.mock("ably", () => ({
  Rest: class MockRest {
    auth = {
      createTokenRequest: ablyMocks.createTokenRequest,
    };
  },
}));

import { createConversationTokenRequest } from "@/lib/ably";

describe("Ably conversation authorization", () => {
  it("limits the token capability to subscribing to one private conversation channel", async () => {
    ablyMocks.createTokenRequest.mockResolvedValueOnce({ keyName: "test" });

    await createConversationTokenRequest("user_123", "conversation_456");

    expect(ablyMocks.createTokenRequest).toHaveBeenCalledWith({
      clientId: "user_123",
      ttl: 60 * 60 * 1000,
      capability: JSON.stringify({
        "private:conversation:conversation_456": ["subscribe"],
      }),
    });
  });
});
