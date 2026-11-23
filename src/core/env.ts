import "server-only";
import { z } from "zod";

// Variables d'environnement validées au démarrage (docs/architecture.md §5).
// Chaque incrément ajoute les variables dont il a besoin.

/** Texte facultatif : une valeur vide dans `.env` équivaut à une valeur absente. */
const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional(),
);

/**
 * Exigées en production : informations du vendeur (US-38, le numéro de TVA reste facultatif),
 * clé de l'IA (sans elle, l'IA est simulée : développement et tests), sel de hachage des
 * adresses IP (plafond de CV gratuits, H27) et clés Stripe (sans elles, le paiement est
 * indisponible : message « Le paiement est momentanément indisponible »).
 */
const REQUIRED_IN_PRODUCTION = [
  "ANTHROPIC_API_KEY",
  "IP_HASH_SALT",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "LEGAL_COMPANY_NAME",
  "LEGAL_FORM",
  "LEGAL_REGISTRATION",
  "LEGAL_ADDRESS",
  "LEGAL_EMAIL",
  "LEGAL_PUBLISHER",
  "LEGAL_HOSTING",
  "LEGAL_MEDIATOR",
] as const;

const envSchema = z
  .object({
    NEXT_PUBLIC_SITE_URL: z.url(),
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    SUPABASE_SECRET_KEY: z.string().min(1),
    GOOGLE_AUTH_ENABLED: z.stringbool().default(false),
    ADS_REMOVAL_ENABLED: z.stringbool().default(false),
    ANTHROPIC_API_KEY: optionalText,
    ANTHROPIC_MODEL: z.string().min(1).default("claude-opus-5-5"),
    STRIPE_SECRET_KEY: optionalText,
    STRIPE_WEBHOOK_SECRET: optionalText,
    IP_HASH_SALT: optionalText.refine((value) => !value || value.length >= 32, {
      error: "32 caractères minimum",
    }),
    LEGAL_COMPANY_NAME: optionalText,
    LEGAL_FORM: optionalText,
    LEGAL_REGISTRATION: optionalText,
    LEGAL_ADDRESS: optionalText,
    LEGAL_EMAIL: optionalText,
    LEGAL_PUBLISHER: optionalText,
    LEGAL_VAT_NUMBER: optionalText,
    LEGAL_HOSTING: optionalText,
    LEGAL_MEDIATOR: optionalText,
  })
  .superRefine((values, context) => {
    if (values.VERCEL_ENV !== "production") return;
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!values[key]) {
        context.addIssue({
          code: "custom",
          path: [key],
          message: "obligatoire en production",
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const invalidKeys = parsed.error.issues.map((issue) => issue.path.join("."));
  throw new Error(
    `Variables d'environnement manquantes ou invalides : ${invalidKeys.join(", ")}. Voir .env.example.`,
  );
}

export const env = parsed.data;
