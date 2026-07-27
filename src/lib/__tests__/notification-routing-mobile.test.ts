import { describe, expect, it } from "vitest";

import {
  normalizeNotificationPayload,
  resolveNotificationNavigationTarget,
} from "../../../CuidouApp/src/navigation/notification-routing";

describe("mobile notification routing", () => {
  it("routes chat messages to the right conversation", () => {
    const payload = normalizeNotificationPayload({
      notificationType: "CHAT_MESSAGE",
      conversationId: "conv_123",
    });

    expect(resolveNotificationNavigationTarget(payload, "PROFESSIONAL")).toBe(
      "/(protected)/chat/conv_123",
    );
  });

  it("returns null for chat messages without conversation id", () => {
    const payload = normalizeNotificationPayload({
      notificationType: "CHAT_MESSAGE",
    });

    expect(resolveNotificationNavigationTarget(payload, "FAMILY")).toBeNull();
  });

  it("routes APPLICATION_RECEIVED to family pipeline", () => {
    const payload = normalizeNotificationPayload({
      notificationType: "APPLICATION_RECEIVED",
    });

    expect(resolveNotificationNavigationTarget(payload, "FAMILY")).toBe("/(family)/pipeline");
    expect(resolveNotificationNavigationTarget(payload, "PROFESSIONAL")).toBeNull();
  });

  it("routes invitation status updates by authenticated role", () => {
    const payload = normalizeNotificationPayload({
      notificationType: "INVITATION_STATUS_UPDATED",
    });

    expect(resolveNotificationNavigationTarget(payload, "FAMILY")).toBe("/(family)/invitations");
    expect(resolveNotificationNavigationTarget(payload, "PROFESSIONAL")).toBe(
      "/(professional)/invitations",
    );
  });

  it("does not route invitation updates when role is missing", () => {
    const payload = normalizeNotificationPayload({
      notificationType: "INVITATION_STATUS_UPDATED",
    });

    expect(resolveNotificationNavigationTarget(payload, undefined)).toBeNull();
    expect(resolveNotificationNavigationTarget(payload, null)).toBeNull();
  });

  it("keeps APPLICATION_STATUS_UPDATED split by role", () => {
    const payload = normalizeNotificationPayload({
      notificationType: "APPLICATION_STATUS_UPDATED",
    });

    expect(resolveNotificationNavigationTarget(payload, "PROFESSIONAL")).toBe(
      "/(professional)/applications",
    );
    expect(resolveNotificationNavigationTarget(payload, "FAMILY")).toBe("/(family)/pipeline");
    expect(resolveNotificationNavigationTarget(payload, undefined)).toBeNull();
  });

  it("returns null for unknown notification types", () => {
    const payload = normalizeNotificationPayload({
      notificationType: "UNKNOWN_EVENT",
    });

    expect(resolveNotificationNavigationTarget(payload, "FAMILY")).toBeNull();
  });

  it("routes documents only to professionals", () => {
    const payload = normalizeNotificationPayload({
      notificationType: "DOCUMENT_STATUS_UPDATED",
    });

    expect(resolveNotificationNavigationTarget(payload, "PROFESSIONAL")).toBe(
      "/(professional)/documents",
    );
    expect(resolveNotificationNavigationTarget(payload, "FAMILY")).toBeNull();
  });

  it.each(["REPORT_STATUS_UPDATED", "SYSTEM"])(
    "routes %s to the notifications center",
    (notificationType) => {
      const payload = normalizeNotificationPayload({ notificationType });
      expect(resolveNotificationNavigationTarget(payload, "FAMILY")).toBe(
        "/(protected)/notifications",
      );
    },
  );

  it("ignores malformed payload fields", () => {
    const payload = normalizeNotificationPayload({
      notificationType: 123,
      conversationId: true,
    });

    expect(payload.notificationType).toBeUndefined();
    expect(payload.conversationId).toBeUndefined();
    expect(resolveNotificationNavigationTarget(payload, "PROFESSIONAL")).toBeNull();
  });
});
