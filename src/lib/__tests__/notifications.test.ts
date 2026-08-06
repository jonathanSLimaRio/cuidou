import { describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  notification: { create: vi.fn(), createMany: vi.fn() },
  pushToken: { findMany: vi.fn() },
}));
const pushMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/expo-push", () => ({ sendExpoPushNotifications: pushMock }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

import { notifyMany, notifyUser } from "../notifications";

describe("notifications", () => {
  it("persists a notification and dispatches push tokens", async () => {
    prismaMock.notification.create.mockResolvedValue({ id: "notification-1" });
    prismaMock.pushToken.findMany.mockResolvedValue([{ token: "ExponentPushToken[test]" }]);
    pushMock.mockResolvedValue(undefined);
    await expect(notifyUser({ userId: "u1", type: "SYSTEM", title: "Aviso", data: { href: "/" } })).resolves.toEqual({ id: "notification-1" });
    await vi.waitFor(() => expect(pushMock).toHaveBeenCalledWith([
      expect.objectContaining({ to: "ExponentPushToken[test]", title: "Aviso", channelId: "default" }),
    ]));
  });

  it("handles empty and batched notifications", async () => {
    await expect(notifyMany([])).resolves.toBeUndefined();
    prismaMock.notification.createMany.mockResolvedValue({ count: 1 });
    prismaMock.pushToken.findMany.mockResolvedValue([]);
    await notifyMany([{ userId: "u2", type: "SYSTEM", title: "Sistema" }]);
    expect(prismaMock.notification.createMany).toHaveBeenCalledOnce();
  });

  it("contains push provider failures", async () => {
    prismaMock.notification.create.mockResolvedValue({ id: "notification-2" });
    prismaMock.pushToken.findMany.mockRejectedValueOnce(new Error("push offline"));
    await notifyUser({ userId: "u3", type: "SYSTEM", title: "Aviso" });
    await vi.waitFor(() => expect(prismaMock.pushToken.findMany).toHaveBeenCalled());
  });
});
