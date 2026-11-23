import { defineConfig, devices } from "@playwright/test";

// Port modifiable (`E2E_PORT`) pour tester le build de production à côté d'un serveur de dev.
const PORT = Number(process.env.E2E_PORT ?? 3000);
const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  // Un seul serveur répond à tous les navigateurs : au-delà de 3 en parallèle, il sature et les
  // actions de connexion dépassent les délais (7 par défaut sur 14 processeurs : échecs aléatoires).
  workers: isCi ? 2 : 3,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: isCi ? [["list"], ["html", { open: "never" }]] : "list",
  // Les actions de connexion attendent Supabase et l'envoi d'un e-mail : jusqu'à plusieurs
  // secondes quand les tests tournent en parallèle (mesuré : médiane 0,5 s, maximum 4,7 s).
  expect: { timeout: 10_000 },
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
    command: isCi ? `npm run start -- -p ${PORT}` : `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}/fr`,
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});
