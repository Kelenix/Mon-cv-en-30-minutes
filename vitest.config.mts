import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    projects: [
      // Logique pure, sans service externe (`npm test`).
      {
        extends: true,
        test: { name: "unit", include: ["tests/unit/**/*.test.ts"] },
      },
      // RLS et fonctions SQL contre Supabase local, démarré dans Docker (`npm run test:db`).
      {
        extends: true,
        test: {
          name: "db",
          include: ["tests/db/**/*.test.ts"],
          testTimeout: 20_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
});
