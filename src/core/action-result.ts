import type { z } from "zod";

// Format commun des réponses des Server Actions (docs/system-design.md §1 et §2). Le message
// affiché est traduit côté client à partir du code (espace de traduction `errors`).

export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "INSUFFICIENT_CREDITS"
  | "CV_LIMIT_REACHED"
  | "RATE_LIMITED"
  | "BOT_CHECK_FAILED"
  | "FREE_LIMIT_REACHED"
  | "AI_UNAVAILABLE"
  | "AI_INVALID_OUTPUT"
  | "CONFLICT"
  | "PAYMENT_ERROR"
  | "INTERNAL";

/**
 * Champ en erreur → clé de traduction de `errors.fields` (ex. `required`, `tooLong`) ; pour
 * `INSUFFICIENT_CREDITS`, coût de l'opération et crédits manquants ; pour `CONFLICT`, la raison
 * (`reason`).
 */
export type FieldErrors = Record<string, string>;

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; details?: FieldErrors } };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(
  code: ErrorCode,
  details?: FieldErrors,
): ActionResult<never> {
  return { ok: false, error: details ? { code, details } : { code } };
}

/** Erreurs de validation Zod → premier message (clé de traduction) de chaque champ. */
export function validationError(error: z.ZodError): ActionResult<never> {
  const details: FieldErrors = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    details[field] ??= issue.message;
  }
  return fail("VALIDATION_ERROR", details);
}
