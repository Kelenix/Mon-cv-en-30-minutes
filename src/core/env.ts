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
 * Exigées en production : informations du vendeur (US-38 ; forme juridique, immatriculation,
 * adresse, TVA et médiateur restent facultatifs : leur phrase est alors retirée des pages),
 * clé de l'IA (sans elle, l'IA est simulée : développement et tests), sel de hachage des
 * adresses IP (plafonds par IP), serveur d'e-mails (sans SMTP, les e-mails sont seulement
 * journalisés), secret de la tâche quotidienne de rétention et clés Turnstile (sans elles, la
 * vérification anti-robot est désactivée : développement et tests). Les clés Stripe restent
 * facultatives (ADR-045) : sans elles, le site tourne sans paiement (« Le paiement est
 * momentanément indisponible »).
 */
const REQUIRED_IN_PRODUCTION = [
  "ANTHROPIC_API_KEY",
  "IP_HASH_SALT",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_SENDER_EMAIL",
  "CRON_SECRET",
  "TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "LEGAL_COMPANY_NAME",
  "LEGAL_EMAIL",
  "LEGAL_PUBLISHER",
  "LEGAL_HOSTING",
] as const;

const envSchema = z
  .object({
    NEXT_PUBLIC_SITE_URL: z.url(),
    // Site public : variables de production exigées (fichier du serveur, docs/deployment.md).
    APP_ENV: z.enum(["production", "development"]).optional(),
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    SUPABASE_SECRET_KEY: z.string().min(1),
    GOOGLE_AUTH_ENABLED: z.stringbool().default(false),
    ADS_REMOVAL_ENABLED: z.stringbool().default(false),
    // google : Ad Manager (tous les formats) ; adsense : bannière et native seulement (ADR-047).
    ADS_MODE: z.enum(["off", "simulation", "adsense", "google"]).default("off"),
    ADS_PUBLISHER_ID: optionalText.refine(
      (value) => !value || /^pub-\d{10,20}$/.test(value),
      { error: "format pub-0000000000000000" },
    ),
    ADS_NETWORK_CODE: optionalText.refine(
      (value) => !value || /^\d{4,12}$/.test(value),
      { error: "code réseau Ad Manager (chiffres)" },
    ),
    // Blocs d'annonces AdSense : facultatifs pendant l'examen du site (ads.txt suffit).
    ADS_SLOT_BANNER: optionalText.refine(
      (value) => !value || /^\d{6,12}$/.test(value),
      { error: "identifiant de bloc AdSense (chiffres)" },
    ),
    ADS_SLOT_NATIVE: optionalText.refine(
      (value) => !value || /^\d{6,12}$/.test(value),
      { error: "identifiant de bloc AdSense (chiffres)" },
    ),
    ANTHROPIC_API_KEY: optionalText,
    ANTHROPIC_MODEL: z.string().min(1).default("claude-opus-5-5"),
    // Tests de bout en bout : IA simulée même si une clé est présente (résultats stables, gratuits).
    AI_SIMULATION: z.stringbool().default(false),
    STRIPE_SECRET_KEY: optionalText,
    STRIPE_WEBHOOK_SECRET: optionalText,
    IP_HASH_SALT: optionalText.refine((value) => !value || value.length >= 32, {
      error: "32 caractères minimum",
    }),
    // E-mails envoyés par le site (avertissement avant suppression, US-40).
    SMTP_HOST: optionalText,
    SMTP_PORT: z.coerce.number().int().positive().default(465),
    SMTP_USER: optionalText,
    SMTP_PASSWORD: optionalText,
    SMTP_SENDER_EMAIL: optionalText.pipe(z.email().optional()),
    SMTP_SENDER_NAME: z.string().trim().min(1).default("Mon CV en 30 Secondes"),
    // Protection contre les robots à la connexion (Cloudflare Turnstile, ADR-039).
    TURNSTILE_SITE_KEY: optionalText,
    TURNSTILE_SECRET_KEY: optionalText,
    // Espace d'administration : adresses e-mail des administrateurs, séparées par des virgules
    // (ADR-040). Vide : personne n'y a accès.
    ADMIN_EMAILS: z
      .string()
      .default("")
      .transform((value) =>
        value
          .split(",")
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean),
      ),
    // Version déployée (commit), affichée dans l'état du système.
    APP_VERSION: optionalText,
    // Jeton des tâches planifiées (`/api/cron/*`).
    CRON_SECRET: optionalText.refine((value) => !value || value.length >= 32, {
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
    // Publicités Google : identifiants obligatoires (tâche manuelle 10).
    const adsKeys = {
      off: [],
      simulation: [],
      adsense: ["ADS_PUBLISHER_ID"],
      google: ["ADS_PUBLISHER_ID", "ADS_NETWORK_CODE"],
    } as const;
    for (const key of adsKeys[values.ADS_MODE]) {
      if (!values[key]) {
        context.addIssue({
          code: "custom",
          path: [key],
          message: `obligatoire avec ADS_MODE=${values.ADS_MODE}`,
        });
      }
    }
    if (values.APP_ENV !== "production") return;
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
