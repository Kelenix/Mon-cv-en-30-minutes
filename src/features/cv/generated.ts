import { z } from "zod";
import { localeSchema } from "@/i18n/locale-schema";
import { CV_LIMITS } from "./schemas";

// Contenus générés conservés avec le CV (US-28 à US-30, H20, H21) : schémas partagés par les
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

/** Poste visé (lettre, entretien) : obligatoire. */
const positionSchema = z
  .string()
  .trim()
  .min(2, { error: "required" })
  .max(GENERATED_LIMITS.position, { error: "tooLong" });

/** Demande de lettre (US-29 c.1) : poste obligatoire, entreprise et annonce facultatives. */
export const letterRequestSchema = z.object({
  position: positionSchema,
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

/** Simulation d'entretien (US-30) : 8 questions, réponses de 2 000 caractères au plus. */
export const INTERVIEW_LIMITS = {
  questions: 8,
  question: 300,
  answer: 2_000,
  strengths: 500,
  improvements: 500,
  example: 1_200,
} as const;

export const interviewRequestSchema = z.object({
  position: positionSchema,
  language: localeSchema,
});

/** Une réponse par question, vide si l'utilisateur n'y répond pas ; au moins une réponse. */
export const interviewAnswersSchema = z
  .array(z.string().max(INTERVIEW_LIMITS.answer, { error: "tooLong" }))
  .length(INTERVIEW_LIMITS.questions)
  .refine((answers) => answers.some((answer) => answer.trim()), {
    error: "required",
  });

export const interviewFeedbackSchema = z.object({
  /** Rang de la question (0 à 7). */
  index: z
    .number()
    .int()
    .min(0)
    .max(INTERVIEW_LIMITS.questions - 1),
  strengths: text(INTERVIEW_LIMITS.strengths),
  improvements: text(INTERVIEW_LIMITS.improvements),
  example: text(INTERVIEW_LIMITS.example),
});
export type InterviewFeedback = z.infer<typeof interviewFeedbackSchema>;

/** Contenu conservé : les questions, puis le retour (une entrée par question répondue). */
export const interviewOutputSchema = z.object({
  questions: z
    .array(text(INTERVIEW_LIMITS.question))
    .length(INTERVIEW_LIMITS.questions),
  feedback: z.array(interviewFeedbackSchema).optional(),
});
export type InterviewOutput = z.infer<typeof interviewOutputSchema>;
