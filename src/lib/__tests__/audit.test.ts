import { expect, it, vi } from "vitest";

const create = vi.hoisted(() => vi.fn().mockResolvedValue({ id: "audit-1" }));
vi.mock("@/lib/prisma", () => ({ prisma: { auditLog: { create } } }));
import { writeAuditLog } from "../audit";

it("persists an attributed immutable audit entry", async () => {
  await expect(writeAuditLog({ adminId: "admin-1", action: "USER_STATUS_UPDATED", targetType: "USER", targetId: "user-1", metadata: { reason: "policy" } })).resolves.toEqual({ id: "audit-1" });
  expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ adminId: "admin-1", targetId: "user-1" }) });
});
