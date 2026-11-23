"use server";

import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import {
  type ActionResult,
  fail,
  ok,
  validationError,
} from "@/core/action-result";
import {
  adaptToJob as writeAdaptation,
  improveExperience as writeExperience,
  summaryVariants,
} from "@/features/ai/cv-tools-writer";
import { AiError } from "@/features/ai/client";
import { runPaidAiOperation } from "@/features/ai/operation";
import { getCurrentUser } from "@/features/auth/session";
import { getActivePlan } from "@/features/billing/subscription";
import { planEntitlements } from "@/features/plans/entitlements";
import { localeSchema } from "@/i18n/locale-schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { clip } from "./content";
import { getOwnCv } from "./repository";
import {
  CV_LIMITS,
  type CvContent,
  cvContentSchema,
  type CvExperience,
} from "./schemas";
import { cleanVariants, experienceProposal, mergeAdaptation } from "./tools";

// Outils d'amélioration par l'IA (US-25 à US-27, docs/system-design.md §3) : chaque action
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
