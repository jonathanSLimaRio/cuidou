import { defineConfig, devices } from "@playwright/test";

// Never point the default E2E run at an arbitrary process already using port 3000.
// An explicit PLAYWRIGHT_BASE_URL opts into an externally managed environment.
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const playwrightPort = Number(process.env.PLAYWRIGHT_PORT ?? "3100");
const baseURL = externalBaseUrl ?? `http://127.0.0.1:${playwrightPort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : Number(process.env.PLAYWRIGHT_WORKERS ?? "2"),
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  // CI and PLAYWRIGHT_BASE_URL are externally managed. Local runs always start
  // an isolated Cuidou server and fail if the dedicated port is occupied.
  webServer:
    process.env.CI || externalBaseUrl
      ? undefined
      : {
          command: `npm run dev -- --hostname 127.0.0.1 --port ${playwrightPort}`,
          url: baseURL,
          reuseExistingServer: false,
          timeout: 120_000,
        },
});
