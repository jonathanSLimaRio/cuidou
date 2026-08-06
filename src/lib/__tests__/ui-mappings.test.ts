import { UserRole } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { getQuickRepliesForRole, resolveQuickReply } from "../chat-quick-replies";
import { invitationStatusLabel, invitationStatusTone } from "../invitation-ui";
import { getNotificationToastTone, mapNotificationToToast } from "../notification-toast-map";

describe("UI domain mappings", () => {
  it("scopes chat quick replies to each role", () => {
    expect(getQuickRepliesForRole(UserRole.FAMILY)).toHaveLength(4);
    expect(getQuickRepliesForRole(UserRole.PROFESSIONAL)).toHaveLength(4);
    expect(getQuickRepliesForRole(UserRole.ADMIN)).toHaveLength(8);
    expect(getQuickRepliesForRole(null)).toEqual([]);
    expect(resolveQuickReply(UserRole.FAMILY, "family_docs")?.text).toContain("documentos");
    expect(resolveQuickReply(UserRole.FAMILY, "missing")).toBeNull();
  });

  it("maps every invitation status", () => {
    expect(invitationStatusLabel.ACCEPTED).toBe("Aceito");
    expect(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED", "CANCELED"].map((status) => invitationStatusTone(status as never))).toEqual([
      "warning", "success", "danger", "neutral", "info",
    ]);
  });

  it("maps known and future notification types safely", () => {
    expect(getNotificationToastTone("CHAT_MESSAGE")).toBe("info");
    expect(getNotificationToastTone("UNKNOWN")).toBe("neutral");
    expect(mapNotificationToToast({ id: "1", type: "SYSTEM", title: "Aviso", body: null })).toEqual({
      id: "notification-1", tone: "neutral", title: "Aviso", description: undefined,
    });
  });
});
