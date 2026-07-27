import { expect, test } from "@playwright/test";

const BASE =
  process.env.PLAYWRIGHT_BASE_URL ??
  `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? "3100"}`;

test("mobile session requires a bearer token", async ({ request }) => {
  const response = await request.get(`${BASE}/api/mobile/auth/session`);

  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toMatchObject({ code: "unauthorized" });
});

test("mobile login validates the payload before accessing credentials", async ({ request }) => {
  const response = await request.post(`${BASE}/api/mobile/auth/login`, {
    data: { email: "invalid", password: "" },
  });

  expect(response.status()).toBe(422);
});

test("mobile refresh validates the payload", async ({ request }) => {
  const response = await request.post(`${BASE}/api/mobile/auth/refresh`, {
    data: { refreshToken: "short" },
  });

  expect(response.status()).toBe(422);
});

test("mobile Google login reports when the provider is not configured", async ({ request }) => {
  const response = await request.post(`${BASE}/api/mobile/auth/google`, {
    data: { idToken: "token-that-is-long-enough-for-schema" },
  });

  // The endpoint must never accept an unverifiable token. It either reports
  // missing configuration or rejects the token after provider validation.
  expect([401, 503]).toContain(response.status());
});
