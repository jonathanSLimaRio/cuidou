import { expect, test } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
test("GET /api/health returns 200 with expected shape", async ({ request }) => {
  const res = await request.get(`${BASE}/api/health`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toMatchObject({
    status: expect.stringMatching(/^(ok|degraded)$/),
    timestamp: expect.any(String),
    uptimeSeconds: expect.any(Number),
    db: expect.stringMatching(/^(ok|error)$/),
  });
});

// ---------------------------------------------------------------------------
// Auth — signup (does not create a real user, just validates 4xx shapes)
// ---------------------------------------------------------------------------
test("POST /api/auth/signup rejects short name with 422", async ({ request }) => {
  const res = await request.post(`${BASE}/api/auth/signup`, {
    data: { name: "A", email: "test@example.com", password: "Senha123", confirmPassword: "Senha123" },
  });
  expect(res.status()).toBe(422);
});

test("POST /api/auth/signup rejects invalid email with 422", async ({ request }) => {
  const res = await request.post(`${BASE}/api/auth/signup`, {
    data: { name: "Valid Name", email: "not-email", password: "Senha123", confirmPassword: "Senha123" },
  });
  expect(res.status()).toBe(422);
});

test("POST /api/auth/signup rejects weak password with 422", async ({ request }) => {
  const res = await request.post(`${BASE}/api/auth/signup`, {
    data: { name: "Valid Name", email: "v@example.com", password: "onlyletters", confirmPassword: "onlyletters" },
  });
  expect(res.status()).toBe(422);
});

// ---------------------------------------------------------------------------
// Protected endpoints — 401 without token
// ---------------------------------------------------------------------------
const PROTECTED_GETS = [
  "/api/family/profile",
  "/api/professional/profile",
  "/api/jobs",
  "/api/contracts",
  "/api/notifications",
  "/api/conversations",
];

for (const path of PROTECTED_GETS) {
  test(`GET ${path} returns 401 without auth`, async ({ request }) => {
    const res = await request.get(`${BASE}${path}`);
    expect(res.status()).toBe(401);
  });
}

const PROTECTED_POSTS = [
  { path: "/api/reviews", body: {} },
  { path: "/api/reports", body: {} },
];

for (const { path, body } of PROTECTED_POSTS) {
  test(`POST ${path} returns 401 without auth`, async ({ request }) => {
    const res = await request.post(`${BASE}${path}`, { data: body });
    expect(res.status()).toBe(401);
  });
}

// ---------------------------------------------------------------------------
// Admin — 401/403 without auth
// ---------------------------------------------------------------------------
test("GET /api/admin/metrics returns 401 without auth", async ({ request }) => {
  const res = await request.get(`${BASE}/api/admin/metrics`);
  expect(res.status()).toBe(401);
});

test("GET /api/admin/audit-logs returns 401 without auth", async ({ request }) => {
  const res = await request.get(`${BASE}/api/admin/audit-logs`);
  expect(res.status()).toBe(401);
});

// ---------------------------------------------------------------------------
// Reviews — public GET requires at least one filter
// ---------------------------------------------------------------------------
test("GET /api/reviews without filters returns 400", async ({ request }) => {
  const res = await request.get(`${BASE}/api/reviews`);
  expect(res.status()).toBe(400);
});

test("GET /api/reviews with revieweeId returns 200", async ({ request }) => {
  // No real data needed — just validating schema accepts the param
  const res = await request.get(`${BASE}/api/reviews?revieweeId=nonexistent-id`);
  // 200 with empty items is acceptable
  expect([200, 404]).toContain(res.status());
  if (res.status() === 200) {
    const body = await res.json();
    expect(body).toHaveProperty("items");
    expect(Array.isArray(body.items)).toBe(true);
  }
});
