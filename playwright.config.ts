import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: isCi ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "ordinateur",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // En CI, le build de production est testé ; en local, le serveur de développement suffit.
    command: isCi ? "npm run start" : "npm run dev",
    url: `http://localhost:${PORT}/fr`,
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});
