import { z } from "@/lib/zod";
import { localeSchema } from "@/i18n/locale-schema";
import { DELETE_CONFIRMATION_WORDS } from "./delete-confirmation";

// Règles de saisie du profil (docs/data-model.md, profiles), partagées par les formulaires et
// revalidées par les actions. Les messages sont des clés de traduction (`errors.fields`).

const nameSchema = z
  .string()
  .trim()
  .min(1, { error: "required" })
  .max(60, { error: "tooLong" });

/** Texte facultatif : vide → `null` en base. */
function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, { error: "tooLong" })
    .transform((value) => value || null);
}

export const welcomeSchema = z.object({
  locale: localeSchema,
  firstName: nameSchema,
  lastName: nameSchema,
});

export const profileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: optionalText(30).refine(
    (value) => !value || /^[+0-9 ().-]+$/.test(value),
    {
      error: "invalidPhone",
    },
  ),
  city: optionalText(80),
});

export type ProfileValues = {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
};

export const deleteAccountSchema = z
  .object({ locale: localeSchema, confirmation: z.string() })
  .refine(
    ({ locale, confirmation }) =>
      confirmation.trim().toLocaleUpperCase(locale) ===
      DELETE_CONFIRMATION_WORDS[locale],
    { error: "invalidConfirmation", path: ["confirmation"] },
  );
