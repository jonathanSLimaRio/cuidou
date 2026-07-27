import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// Smoke — public pages load
// ---------------------------------------------------------------------------
test("landing page loads", async ({ page }) => {
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(500);
  await expect(page).toHaveTitle(/Cuidou/i);
});

test("login page loads", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Entrar com email e senha" })).toBeVisible();
});

test("signup page loads", async ({ page }) => {
  await page.goto("/signup?tipo=FAMILY", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: /Criar conta/i })).toBeVisible();
});

// ---------------------------------------------------------------------------
// Flow 1 — Signup form validates client-side
// ---------------------------------------------------------------------------
test("signup form shows error for mismatched passwords", async ({ page }) => {
  await page.goto("/signup?tipo=FAMILY", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Nome").fill("Joao Teste");
  await page.getByLabel("Email").fill("joao@teste.com");
  await page.getByLabel("Senha", { exact: true }).fill("Senha123");
  await page.getByLabel("Confirmar senha").fill("Senha456");
  await page.getByRole("button", { name: /Criar conta/i }).click();
  await expect(
    page.locator('[aria-invalid="true"], [role="alert"], .error, [data-error]').first(),
  ).toBeVisible({ timeout: 5_000 });
});

// ---------------------------------------------------------------------------
// Flow 2 — Login form validates
// ---------------------------------------------------------------------------
test("login form shows error for empty fields", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Entrar com email e senha/i }).click();
  await expect(page.locator('input[type="email"]:invalid, [role="alert"]').first()).toBeVisible({
    timeout: 5_000,
  });
});

// ---------------------------------------------------------------------------
// Flow 3 — Marketplace is accessible
// ---------------------------------------------------------------------------
test("marketplace page loads", async ({ page }) => {
  await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
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
    headers: { "x-forwarded-for": `127.0.20.${Date.now() % 200}` },
    data: { name: "Test", email: `rl-test-${Date.now()}@test.com`, password: "Senha123", confirmPassword: "Senha123" },
  });
  // Regardless of outcome, rate limit headers should be present
  expect(res.headers()["x-ratelimit-limit"]).toBeDefined();
  expect(res.headers()["x-ratelimit-remaining"]).toBeDefined();
});
