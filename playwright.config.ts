import { defineConfig, devices } from "@playwright/test";

// Runs against the stack started with `docker compose up` (or `mise run up`).
// Tests are serial (one worker) because they share seeded demo data; each test
// must be re-runnable against existing state (create uniquely named data).
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  globalSetup: "./e2e/global-setup.ts",
  reporter: [["list"], ["json", { outputFile: "e2e/.results/report.json" }]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    timezoneId: "UTC",
    // The suite checks behaviour, not motion: without this, every click in a dialog waits for its 300 ms slide-in.
    reducedMotion: "reduce",
    locale: "en-GB",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
});
