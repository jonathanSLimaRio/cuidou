import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// Smoke — public pages load
// ---------------------------------------------------------------------------
test("landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Cuidou/i);
  // At minimum the page must not 5xx
  const response = await page.waitForResponse((r) => r.url().endsWith("/") || r.url().includes("localhost:3000"));
  expect(response.status()).toBeLessThan(500);
});

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("form")).toBeVisible();
});

test("signup page loads", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.locator("form")).toBeVisible();
});

// ---------------------------------------------------------------------------
// Flow 1 — Signup form validates client-side
// ---------------------------------------------------------------------------
test("signup form shows error for mismatched passwords", async ({ page }) => {
  await page.goto("/signup");
  await page.fill('input[name="name"]', "João Teste");
  await page.fill('input[name="email"]', "joao@teste.com");
  await page.fill('input[name="password"]', "Senha123");
  await page.fill('input[name="confirmPassword"]', "Senha456");
  await page.click('button[type="submit"]');
  // Expect some error indicator to appear (message or aria-invalid)
  await expect(
    page.locator('[aria-invalid="true"], [role="alert"], .error, [data-error]').first(),
  ).toBeVisible({ timeout: 5_000 });
});

// ---------------------------------------------------------------------------
// Flow 2 — Login form validates
// ---------------------------------------------------------------------------
test("login form shows error for empty fields", async ({ page }) => {
  await page.goto("/login");
  await page.click('button[type="submit"]');
  await expect(page.locator('input[name="email"]:invalid, [role="alert"]').first()).toBeVisible({
    timeout: 5_000,
  });
});

// ---------------------------------------------------------------------------
// Flow 3 — Marketplace is accessible
// ---------------------------------------------------------------------------
test("marketplace page loads", async ({ page }) => {
  await page.goto("/marketplace");
  await expect(page).toHaveURL(/marketplace/);
  // Should not redirect to login (public page)
  await expect(page).not.toHaveURL(/login/);
});

// ---------------------------------------------------------------------------
// Flow 4 — Admin is protected (redirects to login)
// ---------------------------------------------------------------------------
test("admin page redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/login/);
});

// ---------------------------------------------------------------------------
// Flow 5 — Rate limit headers present on signup
// ---------------------------------------------------------------------------
test("signup endpoint returns rate limit headers", async ({ request }) => {
  const res = await request.post("/api/auth/signup", {
    data: { name: "Test", email: `rl-test-${Date.now()}@test.com`, password: "Senha123", confirmPassword: "Senha123" },
  });
  // Regardless of outcome, rate limit headers should be present
  expect(res.headers()["x-ratelimit-limit"]).toBeDefined();
  expect(res.headers()["x-ratelimit-remaining"]).toBeDefined();
});
