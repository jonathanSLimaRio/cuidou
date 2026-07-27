import { afterEach, describe, expect, it, vi } from "vitest";

import { sendExpoPushNotifications } from "@/lib/expo-push";

describe("Expo push delivery", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("ignores malformed Expo tokens before making a network request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await sendExpoPushNotifications([
      {
        to: "not-a-token",
        title: "Teste",
      },
    ]);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("retries transient Expo failures and eventually succeeds", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("temporary", { status: 503 }))
      .mockResolvedValueOnce(new Response("temporary", { status: 503 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await sendExpoPushNotifications([
      {
        to: "ExponentPushToken[test-token]",
        title: "Teste",
      },
    ]);

    expect(fetchSpy).toHaveBeenCalledTimes(3);
  }, 10_000);
});
