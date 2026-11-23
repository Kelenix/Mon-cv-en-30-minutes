import { z } from "zod";

// Variables d'environnement validées au démarrage (docs/architecture.md §5).
// Chaque incrément ajoute les variables dont il a besoin.
const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success) {
  const invalidKeys = parsed.error.issues.map((issue) => issue.path.join("."));
  throw new Error(
    `Variables d'environnement manquantes ou invalides : ${invalidKeys.join(", ")}. Voir .env.example.`,
  );
}

export const env = parsed.data;
