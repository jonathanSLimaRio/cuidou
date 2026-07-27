import { expect, test } from "@playwright/test";

const enabled = process.env.RUN_AUTH_E2E === "1";
const email = process.env.AUTH_E2E_EMAIL;
const password = process.env.AUTH_E2E_PASSWORD;

test.describe("Sprint 04 authenticated contracts", () => {
  test.skip(!enabled || !email || !password, "Set RUN_AUTH_E2E=1, AUTH_E2E_EMAIL and AUTH_E2E_PASSWORD");

  test("professional session can access application pipeline", async ({ request }) => {
    const login = await request.post("/api/mobile/auth/login", {
      data: { email, password },
    });
    expect(login.ok()).toBeTruthy();
    const { accessToken } = await login.json();
    expect(accessToken).toEqual(expect.any(String));

    const applications = await request.get("/api/professional/applications", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(applications.status()).toBe(200);
    expect((await applications.json()).items).toEqual(expect.any(Array));
  });
});
