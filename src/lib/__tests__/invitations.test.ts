import { describe, expect, it } from "vitest";
import {
  buildInvitationExpiry,
  INVITATION_DEFAULT_EXPIRY_DAYS,
  invitationStatusLabel,
  invitationStatusTone,
} from "../invitations";

describe("buildInvitationExpiry", () => {
  it("defaults to INVITATION_DEFAULT_EXPIRY_DAYS days from now", () => {
    const before = new Date();
    const expiry = buildInvitationExpiry();
    const after = new Date();

    const expectedMs = INVITATION_DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    expect(expiry.getTime()).toBeGreaterThanOrEqual(before.getTime() + expectedMs - 1000);
    expect(expiry.getTime()).toBeLessThanOrEqual(after.getTime() + expectedMs + 1000);
  });

  it("uses custom number of days", () => {
    const before = Date.now();
    const expiry = buildInvitationExpiry(3);
    const expectedMs = 3 * 24 * 60 * 60 * 1000;
    expect(expiry.getTime()).toBeGreaterThanOrEqual(before + expectedMs - 1000);
  });

  it("returns a date in the future", () => {
    const expiry = buildInvitationExpiry(1);
    expect(expiry.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("invitationStatusLabel", () => {
  it("has a label for every status", () => {
    const statuses = ["PENDING", "ACCEPTED", "DECLINED", "EXPIRED", "CANCELED"] as const;
    for (const status of statuses) {
      expect(invitationStatusLabel[status]).toBeTruthy();
    }
  });
});

describe("invitationStatusTone", () => {
  it("returns warning for PENDING", () => {
    expect(invitationStatusTone("PENDING")).toBe("warning");
  });

  it("returns success for ACCEPTED", () => {
    expect(invitationStatusTone("ACCEPTED")).toBe("success");
  });

  it("returns danger for DECLINED", () => {
    expect(invitationStatusTone("DECLINED")).toBe("danger");
  });

  it("returns neutral for EXPIRED", () => {
    expect(invitationStatusTone("EXPIRED")).toBe("neutral");
  });

  it("returns info for CANCELED", () => {
    expect(invitationStatusTone("CANCELED")).toBe("info");
  });
});
