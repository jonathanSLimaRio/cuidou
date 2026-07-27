import { expect, test } from "@playwright/test";

// Keep API contract tests aligned with playwright.config.ts. The default run
// uses the isolated Cuidou server on 127.0.0.1:3100 (or PLAYWRIGHT_PORT);
// an explicit PLAYWRIGHT_BASE_URL opts into an externally managed environment.
const BASE =
  process.env.PLAYWRIGHT_BASE_URL ??
  `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? "3100"}`;

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
test("GET /api/health returns public health shape", async ({ request }) => {
  const res = await request.get(`${BASE}/api/health`);
  expect([200, 503]).toContain(res.status());
  const body = await res.json();
  expect(body).toMatchObject({
    status: expect.stringMatching(/^(ok|degraded)$/),
    timestamp: expect.any(String),
    uptimeSeconds: expect.any(Number),
    db: expect.stringMatching(/^(ok|error)$/),
    integrations: expect.objectContaining({
      ably: expect.any(Boolean),
      wordpress: expect.any(Boolean),
      email: expect.any(Boolean),
      expoPush: true,
    }),
    missingIntegrations: expect.any(Array),
  });
});

test("GET /api/professionals never returns unverified public profiles", async ({ request }) => {
  const res = await request.get(`${BASE}/api/professionals?verifiedOnly=false&pageSize=100`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body.items)).toBe(true);
  expect((body.items as Array<{ verificationStatus?: string }>).every((item) => item.verificationStatus === "VERIFIED")).toBe(true);
});

test("GET marketplace filters reject invalid enum values", async ({ request }) => {
  const professionals = await request.get(`${BASE}/api/professionals?serviceType=INVALID`);
  expect(professionals.status()).toBe(422);

  const jobs = await request.get(`${BASE}/api/jobs?serviceType=INVALID`);
  expect(jobs.status()).toBe(422);
});

test("GET /api/ws-token requires authentication", async ({ request }) => {
  const res = await request.get(`${BASE}/api/ws-token?conversationId=missing`);
  expect(res.status()).toBe(401);
});

// ---------------------------------------------------------------------------
// Auth — signup (does not create a real user, just validates 4xx shapes)
// ---------------------------------------------------------------------------
test("POST /api/auth/signup rejects short name with 422", async ({ request }) => {
  const res = await request.post(`${BASE}/api/auth/signup`, {
    headers: { "x-forwarded-for": `127.0.10.${Date.now() % 200}` },
    data: { name: "A", email: "test@example.com", password: "Senha123", confirmPassword: "Senha123" },
  });
  expect(res.status()).toBe(422);
});

test("POST /api/auth/signup rejects invalid email with 422", async ({ request }) => {
  const res = await request.post(`${BASE}/api/auth/signup`, {
    headers: { "x-forwarded-for": `127.0.11.${Date.now() % 200}` },
    data: { name: "Valid Name", email: "not-email", password: "Senha123", confirmPassword: "Senha123" },
  });
  expect(res.status()).toBe(422);
});

test("POST /api/auth/signup rejects weak password with 422", async ({ request }) => {
  const res = await request.post(`${BASE}/api/auth/signup`, {
    headers: { "x-forwarded-for": `127.0.12.${Date.now() % 200}` },
    data: { name: "Valid Name", email: "v@example.com", password: "onlyletters", confirmPassword: "onlyletters" },
  });
  expect(res.status()).toBe(422);
});

test("POST /api/leads rejects missing consent with 422", async ({ request }) => {
  const res = await request.post(`${BASE}/api/leads`, {
    data: { email: "lead@example.com" },
  });
  expect(res.status()).toBe(422);
});

// ---------------------------------------------------------------------------
// Protected endpoints — 401 without token
// ---------------------------------------------------------------------------
const PROTECTED_GETS = [
  "/api/family/profile",
  "/api/professional/profile",
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
  { path: "/api/applications/missing/withdraw", body: {} },
  { path: "/api/invitations/missing/accept", body: {} },
  { path: "/api/invitations/missing/decline", body: {} },
  { path: "/api/invitations/missing/cancel", body: {} },
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

test("GET /api/admin/leads returns 401 without auth", async ({ request }) => {
  const res = await request.get(`${BASE}/api/admin/leads`);
  expect(res.status()).toBe(401);
});

// ---------------------------------------------------------------------------
// Reviews - GET is protected by proxy auth
// ---------------------------------------------------------------------------
test("GET /api/reviews without auth returns 401", async ({ request }) => {
  const res = await request.get(`${BASE}/api/reviews`);
  expect(res.status()).toBe(401);
});

test("GET /api/reviews with revieweeId without auth returns 401", async ({ request }) => {
  const res = await request.get(`${BASE}/api/reviews?revieweeId=nonexistent-id`);
  expect(res.status()).toBe(401);
});
