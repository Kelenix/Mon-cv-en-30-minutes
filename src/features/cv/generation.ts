import "server-only";
import {
  type ActionResult,
  type ErrorCode,
  fail,
  ok,
} from "@/core/action-result";
import { AiError } from "@/features/ai/client";
import { writeCv } from "@/features/ai/cv-writer";
import type { CurrentUser } from "@/features/auth/session";
import {
  FREE_GENERATIONS_PER_IP_PER_DAY,
  OPERATION_COSTS,
} from "@/features/plans/catalog";
import { getActivePlan } from "@/features/credits/wallet";
import {
  canUseIncludedCredits,
  planCharge,
  planEntitlements,
} from "@/features/plans/entitlements";
import { getOwnProfile } from "@/features/profile/data/profile-repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { buildCvContent, clip } from "./content";
import { listOwnCvs } from "./repository";
import { CV_LIMITS, type CvAnswers, cvContentSchema } from "./schemas";
import type { AppLocale } from "@/i18n/routing";

// Orchestration d'une génération de CV (docs/system-design.md §6.1) : droits et limites, début
// de l'opération (débit sous verrou), rédaction par l'IA, puis enregistrement du CV ou
// remboursement. Les écritures privilégiées passent par les fonctions SQL réservées au serveur.

type Admin = ReturnType<typeof createAdminClient>;

/** Erreurs levées par les fonctions SQL et renvoyées telles quelles à l'interface. */
const SQL_ERRORS = [
  "INSUFFICIENT_CREDITS",
  "RATE_LIMITED",
  "FREE_LIMIT_REACHED",
  "CV_LIMIT_REACHED",
  "NOT_FOUND",
] as const satisfies readonly ErrorCode[];

function sqlError(message: string): ErrorCode {
  return SQL_ERRORS.find((code) => message === code) ?? "INTERNAL";
}

async function failOperation(
  admin: Admin,
  operationId: string,
  error: AiError,
) {
  const { error: sqlFailure } = await admin.rpc("fail_ai_operation", {
    p_operation_id: operationId,
    p_error_code: `${error.code}:${error.reason}`,
    p_model: error.usage?.model,
    p_input_tokens: error.usage?.inputTokens,
    p_output_tokens: error.usage?.outputTokens,
    p_cache_read_tokens: error.usage?.cacheReadTokens,
    p_cost_usd_micros: error.usage?.costUsdMicros,
    p_duration_ms: error.usage?.durationMs,
  });
  if (sqlFailure) console.error("Remboursement impossible", sqlFailure.message);
}

/** Même demande rejouée : le CV déjà créé, ou l'issue de la première tentative. */
async function replay(
  admin: Admin,
  operationId: string,
  status: "pending" | "succeeded" | "failed",
): Promise<ActionResult<{ cvId: string; charged: boolean }>> {
  if (status === "pending") return fail("RATE_LIMITED");
  if (status === "failed") return fail("AI_UNAVAILABLE");
  const { data } = await admin
    .from("cvs")
    .select("id")
    .eq("operation_id", operationId)
    .maybeSingle();
  return data ? ok({ cvId: data.id, charged: false }) : fail("NOT_FOUND");
}

export async function generateCvForUser(
  user: CurrentUser,
  input: {
    requestId: string;
    answers: CvAnswers;
    language: AppLocale;
    replaceCvId?: string;
    ipHash: string | null;
  },
): Promise<ActionResult<{ cvId: string; charged: boolean }>> {
  const supabase = await createClient();
  const [profile, wallet, cvs] = await Promise.all([
    getOwnProfile(supabase, user.id),
    supabase
      .from("credit_wallets")
      .select("included_balance, purchased_balance")
      .eq("user_id", user.id)
      .single(),
    listOwnCvs(),
  ]);
  if (wallet.error) return fail("INTERNAL");

  const plan = await getActivePlan();
  const { cvLimit, aiOperationsPerMinute } = planEntitlements(plan);

  if (input.replaceCvId && !cvs.some((cv) => cv.id === input.replaceCvId)) {
    return fail("NOT_FOUND");
  }
  if (!input.replaceCvId && cvLimit !== null && cvs.length >= cvLimit) {
    return fail("CV_LIMIT_REACHED");
  }

  const charge = planCharge({
    plan,
    operation: "generateCv",
    balances: {
      included: wallet.data.included_balance,
      purchased: wallet.data.purchased_balance,
    },
    freeGenerationAvailable: profile.free_generation_used_at === null,
  });
  if (!charge.allowed) {
    return fail("INSUFFICIENT_CREDITS", {
      cost: String(charge.cost),
      missing: String(charge.missing),
    });
  }

  const admin = createAdminClient();
  const begun = await admin
    .rpc("begin_ai_operation", {
      p_user_id: user.id,
      p_request_id: input.requestId,
      p_kind: "generate_cv",
      p_cost: OPERATION_COSTS.generateCv,
      p_allow_included: canUseIncludedCredits(plan, "generateCv"),
      p_try_free: true,
      p_rate_limit: aiOperationsPerMinute,
      p_free_ip_limit: FREE_GENERATIONS_PER_IP_PER_DAY,
      p_ip_hash: input.ipHash ?? undefined,
    })
    .single();
  if (begun.error) {
    const code = sqlError(begun.error.message);
    if (code === "INTERNAL") {
      console.error("Début de génération impossible", begun.error.message);
    }
    return fail(code);
  }
  const operation = begun.data;
  if (!operation.created) {
    return replay(admin, operation.operation_id, operation.status);
  }

  try {
    const { cv, usage } = await writeCv(input.answers, input.language);
    const content = cvContentSchema.safeParse(
      buildCvContent(cv, {
        fullName: [profile.first_name, profile.last_name].join(" "),
        email: user.email,
        phone: profile.phone ?? undefined,
        city: profile.city ?? undefined,
      }),
    );
    if (!content.success)
      throw new AiError("AI_INVALID_OUTPUT", "content", usage);

    const completed = await admin.rpc("complete_cv_generation", {
      p_operation_id: operation.operation_id,
      p_title:
        content.data.header.title || clip(input.answers.job, CV_LIMITS.title),
      p_language: input.language,
      p_answers: input.answers,
      p_content: content.data,
      p_model: usage.model,
      p_input_tokens: usage.inputTokens,
      p_output_tokens: usage.outputTokens,
      p_cache_read_tokens: usage.cacheReadTokens,
      p_cost_usd_micros: usage.costUsdMicros,
      p_duration_ms: usage.durationMs,
      p_replace_cv_id: input.replaceCvId,
      p_cv_limit: cvLimit ?? undefined,
    });
    if (completed.error) {
      const code = sqlError(completed.error.message);
      await failOperation(
        admin,
        operation.operation_id,
        new AiError("AI_UNAVAILABLE", `complete_${code}`, usage),
      );
      return fail(code === "INTERNAL" ? "AI_UNAVAILABLE" : code);
    }
    return ok({ cvId: completed.data, charged: !operation.was_free });
  } catch (error) {
    const aiError =
      error instanceof AiError
        ? error
        : new AiError("AI_UNAVAILABLE", "unexpected");
    console.error("Génération du CV échouée", aiError.message);
    await failOperation(admin, operation.operation_id, aiError);
    return fail(aiError.code);
  }
}
