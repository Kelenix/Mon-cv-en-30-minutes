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

// Opérations IA des outils (Inc-7 à Inc-9, docs/system-design.md §3) : droits et coût selon la
// matrice, début sous verrou (débit, limite par minute, rejeu), appel à l'IA, puis fin réussie
// en base (contenu conservé avec le CV, H20) ou remboursement.

type Enums = Database["public"]["Enums"];
type Admin = ReturnType<typeof createAdminClient>;

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

/** Fin réussie en base (fonction SQL) ; `data` : identifiant du contenu conservé, s'il y en a. */
type Complete<T> = (
  admin: Admin,
  operationId: string,
  value: T,
  usage: AiUsage,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

type OperationResult<T> = ActionResult<{
  value: T;
  generationId: string | null;
}>;

const SQL_ERRORS = [
  "INSUFFICIENT_CREDITS",
  "RATE_LIMITED",
  "NOT_FOUND",
  "CONFLICT",
] as const;

function sqlError(message: string): ErrorCode {
  return SQL_ERRORS.find((code) => code === message) ?? "INTERNAL";
}

/** Coûts et durée de l'appel, pour les fonctions SQL de fin d'opération. */
export function usageParams(usage: AiUsage) {
  return {
    p_model: usage.model,
    p_input_tokens: usage.inputTokens,
    p_output_tokens: usage.outputTokens,
    p_cache_read_tokens: usage.cacheReadTokens,
    p_cost_usd_micros: usage.costUsdMicros,
    p_duration_ms: usage.durationMs,
  };
}

/** Opération close en échec : crédits rendus, coûts de l'appel journalisés s'il a eu lieu. */
async function closeFailed(
  admin: Admin,
  operationId: string,
  errorCode: string,
  usage?: AiUsage,
) {
  console.error("Opération IA échouée", errorCode);
  const { error } = await admin.rpc("fail_ai_operation", {
    p_operation_id: operationId,
    p_error_code: errorCode,
    ...(usage ? usageParams(usage) : {}),
  });
  if (error) console.error("Remboursement impossible", error.message);
}

async function runAiOperation<T>({
  user,
  requestId,
  kind,
  cost,
  allowIncluded,
  rateLimit,
  execute,
  complete,
}: {
  user: CurrentUser;
  requestId: string;
  kind: Enums["ai_operation_kind"];
  cost: number;
  allowIncluded: boolean;
  rateLimit: number;
  execute: () => Promise<{ value: T; usage: AiUsage }>;
  complete: Complete<T>;
}): Promise<OperationResult<T>> {
  const admin = createAdminClient();
  const begun = await admin
    .rpc("begin_ai_operation", {
      p_user_id: user.id,
      p_request_id: requestId,
      p_kind: kind,
      p_cost: cost,
      p_allow_included: allowIncluded,
      p_try_free: false,
      p_rate_limit: rateLimit,
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
    const { data, error } = await complete(
      admin,
      operationId,
      result.value,
      usage,
    );
    if (!error) {
      return ok({
        value: result.value,
        generationId: typeof data === "string" ? data : null,
      });
    }
    // Refus de la fonction SQL (ex. retour déjà donné) : rien n'est conservé ni débité.
    await closeFailed(admin, operationId, `${kind}:${error.message}`, usage);
    const code = sqlError(error.message);
    return fail(code === "INTERNAL" ? "AI_UNAVAILABLE" : code);
  } catch (error) {
    const aiError =
      error instanceof AiError
        ? error
        : new AiError("AI_UNAVAILABLE", "unexpected", usage);
    await closeFailed(
      admin,
      operationId,
      `${kind}:${aiError.code}:${aiError.reason}`,
      aiError.usage,
    );
    return fail(aiError.code);
  }
}

/** Fin réussie qui conserve le contenu avec le CV, le cas échéant. */
function completeWithRecord<T>(
  record?: (value: T) => GenerationRecord,
): Complete<T> {
  return (admin, operationId, value, usage) => {
    const generation = record?.(value);
    return admin.rpc("complete_ai_operation", {
      p_operation_id: operationId,
      ...usageParams(usage),
      ...(generation
        ? {
            p_cv_id: generation.cvId,
            p_kind: generation.kind,
            p_language: generation.language,
            p_input: generation.input ?? {},
            p_output: generation.output,
          }
        : {}),
    });
  };
}

/** Opération payante : coût et crédits utilisables selon la formule (US-09). */
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
}): Promise<OperationResult<T>> {
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

  return runAiOperation({
    user,
    requestId,
    kind: KINDS[operation],
    cost: OPERATION_COSTS[operation],
    allowIncluded: charge.allowIncluded,
    rateLimit: planEntitlements(plan).aiOperationsPerMinute,
    execute,
    complete: completeWithRecord(record),
  });
}

/**
 * Opération offerte, sans débit (lettre offerte, ADR-052) : le droit est vérifié par l'appelant,
 * la limite par minute s'applique.
 */
export async function runOfferedAiOperation<T>({
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
  record?: (value: T) => GenerationRecord;
}): Promise<OperationResult<T>> {
  const plan = await getActivePlan();
  return runAiOperation({
    user,
    requestId,
    kind: KINDS[operation],
    cost: 0,
    allowIncluded: false,
    rateLimit: planEntitlements(plan).aiOperationsPerMinute,
    execute,
    complete: completeWithRecord(record),
  });
}

/** Opération sans débit (retour d'entretien, US-30 c.3) : journalisée et limitée par minute. */
export async function runFreeAiOperation<T>({
  user,
  requestId,
  kind,
  execute,
  complete,
}: {
  user: CurrentUser;
  requestId: string;
  kind: Enums["ai_operation_kind"];
  execute: () => Promise<{ value: T; usage: AiUsage }>;
  complete: Complete<T>;
}): Promise<OperationResult<T>> {
  const plan = await getActivePlan();
  return runAiOperation({
    user,
    requestId,
    kind,
    cost: 0,
    allowIncluded: false,
    rateLimit: planEntitlements(plan).aiOperationsPerMinute,
    execute,
    complete,
  });
}
