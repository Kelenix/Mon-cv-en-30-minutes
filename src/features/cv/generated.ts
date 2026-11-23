import { z } from "zod";
import { localeSchema } from "@/i18n/locale-schema";
import { CV_LIMITS } from "./schemas";

// Contenus générés modifiables par l'utilisateur (US-28, US-29, H21) : schémas partagés par les
// éditeurs et revalidés par le serveur.

/** Limites de LinkedIn (US-28 c.1) et longueur maximale d'une lettre. */
export const GENERATED_LIMITS = {
  headline: 220,
  about: 2_600,
  experience: 2_000,
  letter: 10_000,
  position: 120,
  company: 120,
  jobPosting: 10_000,
} as const;

const text = (max: number) => z.string().max(max, { error: "tooLong" });

export const linkedinOutputSchema = z.object({
  headline: text(GENERATED_LIMITS.headline),
  about: text(GENERATED_LIMITS.about),
  experiences: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        role: text(CV_LIMITS.role),
        company: text(CV_LIMITS.company),
        description: text(GENERATED_LIMITS.experience),
      }),
    )
    .max(CV_LIMITS.experiences),
});
export type LinkedinOutput = z.infer<typeof linkedinOutputSchema>;

export const letterOutputSchema = z.object({
  letter: text(GENERATED_LIMITS.letter),
});
export type LetterOutput = z.infer<typeof letterOutputSchema>;

/** Demande de lettre (US-29 c.1) : poste obligatoire, entreprise et annonce facultatives. */
export const letterRequestSchema = z.object({
  position: z
    .string()
    .trim()
    .min(2, { error: "required" })
    .max(GENERATED_LIMITS.position, { error: "tooLong" }),
  company: z
    .string()
    .trim()
    .max(GENERATED_LIMITS.company, { error: "tooLong" })
    .optional(),
  jobPosting: z
    .string()
    .trim()
    .max(GENERATED_LIMITS.jobPosting, { error: "tooLong" })
    .optional(),
  language: localeSchema,
});

/** Nombre de mots d'une lettre (US-29 c.2 : 250 à 400). */
export function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}
