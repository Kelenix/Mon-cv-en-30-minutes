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

/** Informations du vendeur exigées en production (US-38) ; le numéro de TVA reste facultatif. */
const LEGAL_REQUIRED_IN_PRODUCTION = [
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
    for (const key of LEGAL_REQUIRED_IN_PRODUCTION) {
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
