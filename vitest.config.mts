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
      // Mesure de l'IA réelle sur le jeu de référence (`npm run eval:ai`) : payante, à la demande.
      {
        extends: true,
        resolve: {
          alias: {
            "server-only": fileURLToPath(
              new URL("./node_modules/server-only/empty.js", import.meta.url),
            ),
          },
        },
        test: {
          name: "eval",
          include: ["tests/eval/**/*.eval.ts"],
          testTimeout: 150_000,
        },
      },
    ],
  },
});
