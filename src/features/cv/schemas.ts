import { z } from "zod";
import { localeSchema } from "@/i18n/locale-schema";
import { countrySchema } from "./countries";
import { cvTemplateSchema } from "./templates";

// Schémas partagés du CV (docs/system-design.md §4) : utilisés par l'assistant, l'éditeur et
// revalidés par les actions. Les messages sont des clés de traduction (`errors.fields`).

/** Longueur maximale d'une réponse aux 5 questions (H19). */
export const ANSWER_MAX = 2000;

/** Ordre des 5 questions (INTAKE §5.1) ; seule la première est obligatoire. */
export const ANSWER_KEYS = [
  "job",
  "experiences",
  "skills",
  "education",
  "goal",
] as const;
export type AnswerKey = (typeof ANSWER_KEYS)[number];

/** En dessous de ce total, les réponses 2 à 5 sont jugées trop courtes (US-10 c.2, sans blocage). */
export const SHORT_ANSWERS_THRESHOLD = 80;

const answer = z.string().trim().max(ANSWER_MAX, { error: "tooLong" });

export const cvAnswersSchema = z.object({
  job: answer.min(2, { error: "required" }),
  experiences: answer,
  skills: answer,
  education: answer,
  goal: answer,
});
export type CvAnswers = z.infer<typeof cvAnswersSchema>;

export const generateCvSchema = z.object({
  requestId: z.uuid(),
  answers: cvAnswersSchema,
  language: localeSchema,
  /** Pays visé : modèle recommandé donné au CV (Inc-15). */
  country: countrySchema.optional(),
  /** Modèle choisi dans la vitrine ; sinon le recommandé pour le pays. */
  template: cvTemplateSchema.optional(),
  replaceCvId: z.uuid().optional(),
});

/** Limites du contenu d'un CV : appliquées par l'éditeur, le serveur et la sortie de l'IA. */
export const CV_LIMITS = {
  name: 120,
  title: 120,
  email: 254,
  phone: 30,
  city: 80,
  summary: 600,
  experiences: 15,
  role: 120,
  company: 120,
  location: 80,
  date: 40,
  bullets: 8,
  bullet: 300,
  skills: 40,
  skill: 60,
  education: 10,
  degree: 160,
  school: 160,
  details: 300,
  languages: 10,
  language: 60,
  level: 60,
} as const;

const text = (max: number) => z.string().trim().max(max, { error: "tooLong" });
const list = <T extends z.ZodType>(item: T, max: number) =>
  z.array(item).max(max, { error: "tooMany" });
const itemId = z.string().min(1).max(64);

export const cvContentSchema = z.object({
  header: z.object({
    fullName: text(CV_LIMITS.name),
    title: text(CV_LIMITS.title),
    email: text(CV_LIMITS.email).optional(),
    phone: text(CV_LIMITS.phone).optional(),
    city: text(CV_LIMITS.city).optional(),
  }),
  summary: text(CV_LIMITS.summary),
  experiences: list(
    z.object({
      id: itemId,
      role: text(CV_LIMITS.role),
      company: text(CV_LIMITS.company),
      location: text(CV_LIMITS.location).optional(),
      startDate: text(CV_LIMITS.date).optional(),
      endDate: text(CV_LIMITS.date).optional(),
      bullets: list(text(CV_LIMITS.bullet), CV_LIMITS.bullets),
    }),
    CV_LIMITS.experiences,
  ),
  skills: list(text(CV_LIMITS.skill), CV_LIMITS.skills),
  education: list(
    z.object({
      id: itemId,
      degree: text(CV_LIMITS.degree),
      school: text(CV_LIMITS.school),
      year: text(CV_LIMITS.date).optional(),
      details: text(CV_LIMITS.details).optional(),
    }),
    CV_LIMITS.education,
  ),
  languages: list(
    z.object({
      id: itemId,
      name: text(CV_LIMITS.language),
      level: text(CV_LIMITS.level).optional(),
    }),
    CV_LIMITS.languages,
  ),
});
export type CvContent = z.infer<typeof cvContentSchema>;
export type CvExperience = CvContent["experiences"][number];
export type CvEducation = CvContent["education"][number];
export type CvLanguage = CvContent["languages"][number];

export const updateCvSchema = z.object({
  cvId: z.uuid(),
  content: cvContentSchema,
});
