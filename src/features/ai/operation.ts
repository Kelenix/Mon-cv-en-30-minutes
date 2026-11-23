import "server-only";
import {
  type ActionResult,
  type ErrorCode,
  fail,
  ok,
} from "@/core/action-result";
import type { CurrentUser } from "@/features/auth/session";
import { getActivePlan } from "@/features/billing/subscription";
import { OPERATION_COSTS, type OperationKey } from "@/features/plans/catalog";
import { planCharge, planEntitlements } from "@/features/plans/entitlements";
import type { Database, Json } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AiError, type AiUsage } from "./client";

// Opération IA payante (outils des Inc-7 à Inc-9, docs/system-design.md §3) : droits et coût
// selon la matrice, début sous verrou (débit, limite par minute), appel à l'IA, puis fin réussie
// (contenu conservé avec le CV, H20) ou remboursement.

type Enums = Database["public"]["Enums"];

const KINDS: Record<
  Exclude<OperationKey, "generateCv">,
  Enums["ai_operation_kind"]
> = {
  improveExperience: "improve_experience",
  improveSummary: "improve_summary",
  adaptToJob: "adapt_to_job",
  coverLetter: "cover_letter",
  linkedin: "linkedin",
  interview: "interview",
};

/** Contenu à conserver avec le CV après une opération réussie. */
export type GenerationRecord = {
  cvId: string;
  kind: Enums["generation_kind"];
  language: Enums["app_locale"];
  input?: Json;
  output: Json;
};

const SQL_ERRORS = [
  "INSUFFICIENT_CREDITS",
  "RATE_LIMITED",
  "NOT_FOUND",
] as const;

function sqlError(message: string): ErrorCode {
  return SQL_ERRORS.find((code) => code === message) ?? "INTERNAL";
}

export async function runPaidAiOperation<T>({
  user,
  requestId,
  operation,
  execute,
  record,
}: {
  user: CurrentUser;
  requestId: string;
  operation: Exclude<OperationKey, "generateCv">;
  execute: () => Promise<{ value: T; usage: AiUsage }>;
  /** Contenu conservé avec le CV, le cas échéant. */
  record?: (value: T) => GenerationRecord;
}): Promise<ActionResult<{ value: T; generationId: string | null }>> {
  const supabase = await createClient();
  const [plan, wallet] = await Promise.all([
    getActivePlan(),
    supabase
      .from("credit_wallets")
      .select("included_balance, purchased_balance")
      .eq("user_id", user.id)
      .single(),
  ]);
  if (wallet.error) return fail("INTERNAL");

  const charge = planCharge({
    plan,
    operation,
    balances: {
      included: wallet.data.included_balance,
      purchased: wallet.data.purchased_balance,
    },
  });
  if (!charge.allowed) {
    return fail("INSUFFICIENT_CREDITS", {
      cost: String(charge.cost),
      missing: String(charge.missing),
      // Abonné dont la formule ne paie pas cette fonction (Essential, US-09 c.2).
      purchasedOnly: String(plan !== null && !charge.allowIncluded),
    });
  }

  const admin = createAdminClient();
  const begun = await admin
    .rpc("begin_ai_operation", {
      p_user_id: user.id,
      p_request_id: requestId,
      p_kind: KINDS[operation],
      p_cost: OPERATION_COSTS[operation],
      p_allow_included: charge.allowIncluded,
      p_try_free: false,
      p_rate_limit: planEntitlements(plan).aiOperationsPerMinute,
      p_free_ip_limit: 0,
    })
    .single();
  if (begun.error) return fail(sqlError(begun.error.message));
  // Même demande rejouée (double envoi) : pas de seconde opération.
  if (!begun.data.created) {
    return fail(
      begun.data.status === "failed" ? "AI_UNAVAILABLE" : "RATE_LIMITED",
    );
  }
  const operationId = begun.data.operation_id;

  let usage: AiUsage | undefined;
  try {
    const result = await execute();
    usage = result.usage;
    const generation = record?.(result.value);
    const { data: generationId, error } = await admin.rpc(
      "complete_ai_operation",
      {
        p_operation_id: operationId,
        p_model: usage.model,
        p_input_tokens: usage.inputTokens,
        p_output_tokens: usage.outputTokens,
        p_cache_read_tokens: usage.cacheReadTokens,
        p_cost_usd_micros: usage.costUsdMicros,
        p_duration_ms: usage.durationMs,
        ...(generation
          ? {
              p_cv_id: generation.cvId,
              p_kind: generation.kind,
              p_language: generation.language,
              p_input: generation.input ?? {},
              p_output: generation.output,
            }
          : {}),
      },
    );
    if (error)
      throw new AiError("AI_UNAVAILABLE", `complete_${error.message}`, usage);
    return ok({ value: result.value, generationId: generationId ?? null });
  } catch (error) {
    const aiError =
      error instanceof AiError
        ? error
        : new AiError("AI_UNAVAILABLE", "unexpected", usage);
    console.error("Opération IA échouée", operation, aiError.message);
    const { error: refundError } = await admin.rpc("fail_ai_operation", {
      p_operation_id: operationId,
      p_error_code: `${aiError.code}:${aiError.reason}`,
      p_model: aiError.usage?.model,
      p_input_tokens: aiError.usage?.inputTokens,
      p_output_tokens: aiError.usage?.outputTokens,
      p_cache_read_tokens: aiError.usage?.cacheReadTokens,
      p_cost_usd_micros: aiError.usage?.costUsdMicros,
      p_duration_ms: aiError.usage?.durationMs,
    });
    if (refundError)
      console.error("Remboursement impossible", refundError.message);
    return fail(aiError.code);
  }
}
