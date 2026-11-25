"use server";

import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "@/lib/zod";
import {
  type ActionResult,
  fail,
  ok,
  validationError,
} from "@/core/action-result";
import {
  coverLetter,
  interviewFeedback,
  interviewQuestions,
  linkedinProfile,
  adaptToJob as writeAdaptation,
  improveExperience as writeExperience,
  summaryVariants,
} from "@/features/ai/cv-tools-writer";
import { AiError } from "@/features/ai/client";
import {
  runFreeAiOperation,
  runOfferedAiOperation,
  runPaidAiOperation,
  usageParams,
} from "@/features/ai/operation";
import { getCurrentUser } from "@/features/auth/session";
import { getActivePlan } from "@/features/billing/subscription";
import { planEntitlements } from "@/features/plans/entitlements";
import { localeSchema } from "@/i18n/locale-schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { clip } from "./content";
import {
  GENERATED_LIMITS,
  type InterviewFeedback,
  interviewAnswersSchema,
  interviewOutputSchema,
  interviewRequestSchema,
  type LetterOutput,
  letterOutputSchema,
  letterRequestSchema,
  type LinkedinOutput,
  linkedinOutputSchema,
} from "./generated";
import { getOwnCv } from "./repository";
import {
  CV_LIMITS,
  type CvContent,
  cvContentSchema,
  type CvExperience,
} from "./schemas";
import {
  cleanQuestions,
  cleanVariants,
  experienceProposal,
  feedbackFromAi,
  linkedinFromAi,
  mergeAdaptation,
} from "./tools";

// Outils IA du CV (US-25 à US-30, docs/system-design.md §3) : chaque action
// revérifie la session, la propriété du CV et les droits ; le crédit est débité sous verrou et
// rendu en cas d'échec.

const base = { requestId: z.uuid(), cvId: z.uuid() };

/** Réécrit les puces d'une expérience (US-25) ; l'utilisateur garde ou remplace. */
export async function improveExperience(
  input: unknown,
): Promise<ActionResult<{ proposal: CvExperience }>> {
  const parsed = z
    .object({ ...base, experienceId: z.string().min(1) })
    .safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");

  const cv = await getOwnCv(parsed.data.cvId);
  const experience = cv?.content.experiences.find(
    (item) => item.id === parsed.data.experienceId,
  );
  if (!cv || !experience) return fail("NOT_FOUND");
  // Rien à reformuler sans mission décrite : l'IA inventerait.
  if (experience.bullets.length === 0) return fail("VALIDATION_ERROR");

  const result = await runPaidAiOperation({
    user,
    requestId: parsed.data.requestId,
    operation: "improveExperience",
    execute: async () => {
      const { output, usage } = await writeExperience(experience, cv.language);
      return { value: experienceProposal(experience, output.bullets), usage };
    },
  });
  if (!result.ok) return result;
  refresh();
  return ok({ proposal: result.data.value });
}

/** Propose 3 ou 5 accroches selon la formule (US-26), conservées avec le CV (H20). */
export async function improveSummary(
  input: unknown,
): Promise<ActionResult<{ generationId: string; variants: string[] }>> {
  const parsed = z.object(base).safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");

  const cv = await getOwnCv(parsed.data.cvId);
  if (!cv) return fail("NOT_FOUND");
  const count = planEntitlements(await getActivePlan()).summaryVariants;

  const result = await runPaidAiOperation({
    user,
    requestId: parsed.data.requestId,
    operation: "improveSummary",
    execute: async () => {
      const { output, usage } = await summaryVariants(
        cv.content,
        count,
        cv.language,
      );
      const variants = cleanVariants(output.variants, count);
      if (variants.length === 0) {
        throw new AiError("AI_INVALID_OUTPUT", "no_variants", usage);
      }
      return { value: variants, usage };
    },
    record: (variants) => ({
      cvId: cv.id,
      kind: "summary_variants",
      language: cv.language,
      output: { variants },
    }),
  });
  if (!result.ok) return result;
  refresh();
  return ok({
    generationId: result.data.generationId!,
    variants: result.data.value,
  });
}

/** Annonce : 50 à 10 000 caractères (US-27 c.1). */
const adaptSchema = z.object({
  ...base,
  jobPosting: z
    .string()
    .trim()
    .min(50, { error: "tooShort" })
    .max(10_000, { error: "tooLong" }),
  language: localeSchema,
});

/** Adapte le CV à une annonce (US-27) ; le résultat est conservé avec le CV (H20). */
export async function adaptToJob(input: unknown): Promise<
  ActionResult<{
    generationId: string;
    content: CvContent;
    missingKeywords: string[];
  }>
> {
  const parsed = adaptSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");

  const cv = await getOwnCv(parsed.data.cvId);
  if (!cv) return fail("NOT_FOUND");
  const { jobPosting, language } = parsed.data;

  const result = await runPaidAiOperation({
    user,
    requestId: parsed.data.requestId,
    operation: "adaptToJob",
    execute: async () => {
      const { output, usage } = await writeAdaptation(
        cv.content,
        jobPosting,
        language,
      );
      return { value: mergeAdaptation(cv.content, output), usage };
    },
    record: (adaptation) => ({
      cvId: cv.id,
      kind: "job_adaptation",
      language,
      input: { jobPosting },
      output: adaptation,
    }),
  });
  if (!result.ok) return result;
  refresh();
  return ok({ generationId: result.data.generationId!, ...result.data.value });
}

const adaptationOutput = z.object({
  content: cvContentSchema,
  missingKeywords: z.array(z.string()),
});

/**
 * Applique une adaptation (US-27 c.4) : au CV courant, ou comme nouveau CV pour les formules qui
 * conservent plusieurs CV (Pro, Premium).
 */
export async function applyAdaptation(
  input: unknown,
): Promise<ActionResult<{ cvId: string }>> {
  const parsed = z
    .object({
      generationId: z.uuid(),
      mode: z.enum(["replace", "new"]),
      locale: localeSchema,
    })
    .safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");

  // Lu sous la RLS : une adaptation d'un autre compte est introuvable.
  const supabase = await createClient();
  const { data: generation } = await supabase
    .from("generations")
    .select("cv_id, language, output, cvs(title, answers)")
    .eq("id", parsed.data.generationId)
    .eq("kind", "job_adaptation")
    .maybeSingle();
  const output = adaptationOutput.safeParse(generation?.output);
  if (!generation?.cvs || !output.success) return fail("NOT_FOUND");

  const admin = createAdminClient();
  if (parsed.data.mode === "replace") {
    const { error } = await admin
      .from("cvs")
      .update({ content: output.data.content, language: generation.language })
      .eq("id", generation.cv_id)
      .eq("user_id", user.id);
    if (error) return fail("INTERNAL");
    return ok({ cvId: generation.cv_id });
  }

  if (planEntitlements(await getActivePlan()).cvLimit !== null) {
    return fail("FORBIDDEN");
  }
  const t = await getTranslations({
    locale: parsed.data.locale,
    namespace: "cvTools",
  });
  const { data: created, error } = await admin
    .from("cvs")
    .insert({
      user_id: user.id,
      title: clip(
        t("adapt.newTitle", { title: generation.cvs.title }),
        CV_LIMITS.title,
      ),
      language: generation.language,
      answers: generation.cvs.answers,
      content: output.data.content,
    })
    .select("id")
    .single();
  if (error) return fail("INTERNAL");
  return ok({ cvId: created.id });
}

/** Version LinkedIn (US-28) : titre, section Infos, une description par expérience. */
export async function generateLinkedin(
  input: unknown,
): Promise<ActionResult<{ generationId: string; output: LinkedinOutput }>> {
  const parsed = z.object({ ...base, language: localeSchema }).safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");

  const cv = await getOwnCv(parsed.data.cvId);
  if (!cv) return fail("NOT_FOUND");
  const { language } = parsed.data;

  const result = await runPaidAiOperation({
    user,
    requestId: parsed.data.requestId,
    operation: "linkedin",
    execute: async () => {
      const { output, usage } = await linkedinProfile(cv.content, language);
      return { value: linkedinFromAi(cv.content, output), usage };
    },
    record: (output) => ({
      cvId: cv.id,
      kind: "linkedin",
      language,
      output,
    }),
  });
  if (!result.ok) return result;
  refresh();
  return ok({
    generationId: result.data.generationId!,
    output: result.data.value,
  });
}

async function claimFreeLetter(userId: string) {
  const { data } = await createAdminClient()
    .from("profiles")
    .update({ free_letter_used_at: new Date().toISOString() })
    .eq("id", userId)
    .is("free_letter_used_at", null)
    .select("id")
    .maybeSingle();
  return Boolean(data);
}

async function releaseFreeLetter(userId: string) {
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ free_letter_used_at: null })
    .eq("id", userId);
  if (error) console.error("Lettre offerte non rendue", error.code);
}

/** Lettre de motivation (US-29), conservée avec le CV et modifiable (H20, H21). */
export async function generateCoverLetter(
  input: unknown,
): Promise<ActionResult<{ generationId: string; output: LetterOutput }>> {
  const parsed = letterRequestSchema.extend(base).safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");

  const cv = await getOwnCv(parsed.data.cvId);
  if (!cv) return fail("NOT_FOUND");
  const { position, language } = parsed.data;
  const company = parsed.data.company || undefined;
  const jobPosting = parsed.data.jobPosting || undefined;

  const operation = {
    user,
    requestId: parsed.data.requestId,
    operation: "coverLetter" as const,
    execute: async () => {
      const { output, usage } = await coverLetter(
        cv.content,
        { position, company, jobPosting },
        language,
      );
      const letter = clip(output.letter, GENERATED_LIMITS.letter);
      if (!letter) throw new AiError("AI_INVALID_OUTPUT", "empty", usage);
      return { value: { letter }, usage };
    },
    record: (output: LetterOutput) => ({
      cvId: cv.id,
      kind: "cover_letter" as const,
      language,
      input: {
        position,
        company: company ?? null,
        jobPosting: jobPosting ?? null,
      },
      output,
    }),
  };
  // Première lettre du compte offerte (ADR-052) : réservée avant l'appel, rendue en cas d'échec.
  const offered = await claimFreeLetter(user.id);
  const result = offered
    ? await runOfferedAiOperation(operation)
    : await runPaidAiOperation(operation);
  if (offered && !result.ok) await releaseFreeLetter(user.id);
  if (!result.ok) return result;
  refresh();
  return ok({
    generationId: result.data.generationId!,
    output: result.data.value,
  });
}

const EDITABLE = {
  linkedin: linkedinOutputSchema,
  cover_letter: letterOutputSchema,
} as const;

/** Corrections de l'utilisateur sur une version LinkedIn ou une lettre (gratuit, sous la RLS). */
export async function updateGeneratedContent(
  input: unknown,
): Promise<ActionResult<{ updatedAt: string }>> {
  const parsed = z
    .object({ generationId: z.uuid(), output: z.unknown() })
    .safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");

  const supabase = await createClient();
  const { data: generation } = await supabase
    .from("generations")
    .select("kind")
    .eq("id", parsed.data.generationId)
    .maybeSingle();
  if (!generation) return fail("NOT_FOUND");
  if (!(generation.kind in EDITABLE)) return fail("VALIDATION_ERROR");

  const output = EDITABLE[generation.kind as keyof typeof EDITABLE].safeParse(
    parsed.data.output,
  );
  if (!output.success) return validationError(output.error);

  const { data, error } = await supabase
    .from("generations")
    .update({ output: output.data })
    .eq("id", parsed.data.generationId)
    .select("updated_at")
    .single();
  if (error) return fail("INTERNAL");
  return ok({ updatedAt: data.updated_at });
}

/** Simulation d'entretien (US-30 c.1) : 8 questions adaptées au CV et au poste visé. */
export async function startInterview(
  input: unknown,
): Promise<ActionResult<{ generationId: string; questions: string[] }>> {
  const parsed = interviewRequestSchema.extend(base).safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");

  const cv = await getOwnCv(parsed.data.cvId);
  if (!cv) return fail("NOT_FOUND");
  const { position, language } = parsed.data;

  const result = await runPaidAiOperation({
    user,
    requestId: parsed.data.requestId,
    operation: "interview",
    execute: async () => {
      const { output, usage } = await interviewQuestions(
        cv.content,
        position,
        language,
      );
      const questions = cleanQuestions(output.questions);
      if (!questions) {
        throw new AiError("AI_INVALID_OUTPUT", "questions", usage);
      }
      return { value: questions, usage };
    },
    record: (questions) => ({
      cvId: cv.id,
      kind: "interview",
      language,
      input: { position },
      output: { questions },
    }),
  });
  if (!result.ok) return result;
  refresh();
  return ok({
    generationId: result.data.generationId!,
    questions: result.data.value,
  });
}

/**
 * Retour sur les réponses (US-30 c.2, c.3), sans coût : une seule fois par simulation, réponses
 * et retour conservés avec elle (c.4).
 */
export async function submitInterviewAnswers(
  input: unknown,
): Promise<ActionResult<{ feedback: InterviewFeedback[] }>> {
  const parsed = z
    .object({
      requestId: z.uuid(),
      generationId: z.uuid(),
      answers: interviewAnswersSchema,
    })
    .safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");

  const supabase = await createClient();
  const { data: generation } = await supabase
    .from("generations")
    .select("cv_id, language, input, output")
    .eq("id", parsed.data.generationId)
    .eq("kind", "interview")
    .maybeSingle();
  if (!generation) return fail("NOT_FOUND");
  const request = generation.input as { position?: string; answers?: unknown };
  if (request.answers) return fail("CONFLICT");
  const stored = interviewOutputSchema.safeParse(generation.output);
  const cv = await getOwnCv(generation.cv_id);
  if (!stored.success || !cv) return fail("NOT_FOUND");

  const answers = parsed.data.answers.map((answer) => answer.trim());
  const result = await runFreeAiOperation({
    user,
    requestId: parsed.data.requestId,
    kind: "interview_feedback",
    execute: async () => {
      const { output, usage } = await interviewFeedback(
        cv.content,
        {
          position: request.position ?? "",
          questions: stored.data.questions,
          answers,
        },
        generation.language,
      );
      const feedback = feedbackFromAi(answers, output.feedback);
      if (!feedback) throw new AiError("AI_INVALID_OUTPUT", "feedback", usage);
      return { value: feedback, usage };
    },
    complete: (admin, operationId, feedback, usage) =>
      admin.rpc("complete_interview_feedback", {
        p_operation_id: operationId,
        ...usageParams(usage),
        p_generation_id: parsed.data.generationId,
        p_answers: answers,
        p_feedback: feedback,
      }),
  });
  if (!result.ok) return result;
  refresh();
  return ok({ feedback: result.data.value });
}
