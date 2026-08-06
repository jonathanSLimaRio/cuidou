import { afterEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.hoisted(() => vi.fn());
vi.mock("resend", () => ({ Resend: class { emails = { send: sendMock }; } }));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

describe("structured email delivery", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    sendMock.mockReset();
  });

  it("reports missing provider configuration without throwing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { sendEmail } = await import("../email");
    await expect(sendEmail({ to: "a@example.com", subject: "Teste", html: "<p>ok</p>" })).resolves.toEqual({ sent: false, errorCode: "not_configured" });
  });

  it("returns the provider identifier on success", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    sendMock.mockResolvedValue({ data: { id: "email-1" }, error: null });
    const { sendEmail } = await import("../email");
    await expect(sendEmail({ to: "a@example.com", subject: "Teste", html: "<p>ok</p>" })).resolves.toEqual({ sent: true, providerId: "email-1" });
  });

  it("categorizes permanent provider rejections", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    sendMock.mockResolvedValue({ data: null, error: { message: "invalid", statusCode: 422 } });
    const { sendEmail } = await import("../email");
    await expect(sendEmail({ to: "a@example.com", subject: "Teste", html: "<p>ok</p>" })).resolves.toEqual({ sent: false, errorCode: "provider_rejected" });
  });
});
