import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright e2e config. Requires a running app + seeded DB.
 * First run: `npx playwright install chromium`, then `npm run test:e2e`.
 * The config auto-starts `npm run dev` unless a server is already up.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
