import { expect, it, vi } from "vitest";

const create = vi.hoisted(() => vi.fn());
const loggerError = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: { productEvent: { create } } }));
vi.mock("@/lib/logger", () => ({ logger: { error: loggerError } }));
import { ProductEventName, trackProductEvent } from "../product-events";

it("records product events without leaking persistence failures to the user flow", async () => {
  create.mockResolvedValueOnce({ id: "event-1" });
  trackProductEvent({ name: ProductEventName.SIGNUP_COMPLETED, userId: "user-1", metadata: { source: "web" } });
  await vi.waitFor(() => expect(create).toHaveBeenCalled());
  create.mockRejectedValueOnce(new Error("offline"));
  trackProductEvent({ name: ProductEventName.LOGIN_COMPLETED, anonymousId: "anonymous-1" });
  await vi.waitFor(() => expect(loggerError).toHaveBeenCalled());
});
