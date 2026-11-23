"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type {
  ActionResult,
  ErrorCode,
  FieldErrors,
} from "@/core/action-result";

/**
 * Lance un outil IA payant : identifiant de demande à chaque clic (un double envoi n'est pas
 * débité deux fois), état d'attente, message d'erreur traduit, et détails pour la fenêtre
 * « Solde insuffisant ». `messages` remplace le texte de certaines erreurs (ex. outil gratuit :
 * aucun crédit à rendre).
 */
export function useAiTool<Input, Result>(
  action: (
    input: Input & { requestId: string },
  ) => Promise<ActionResult<Result>>,
  messages: Partial<Record<ErrorCode, string>> = {},
) {
  const tErrors = useTranslations("errors");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [insufficient, setInsufficient] = useState<FieldErrors>();

  function run(input: Input, onSuccess: (result: Result) => void) {
    setError(undefined);
    startTransition(async () => {
      const result = await action({ ...input, requestId: crypto.randomUUID() });
      if (result.ok) {
        onSuccess(result.data);
      } else if (result.error.code === "INSUFFICIENT_CREDITS") {
        setInsufficient(result.error.details ?? {});
      } else {
        // Erreur d'un champ (ex. annonce trop courte), sinon message général.
        const field = Object.values(result.error.details ?? {})[0];
        setError(
          result.error.code === "VALIDATION_ERROR" && field
            ? tErrors(`fields.${field}` as "fields.required")
            : (messages[result.error.code] ?? tErrors(result.error.code)),
        );
      }
    });
  }

  return {
    run,
    pending,
    error,
    insufficient,
    closeInsufficient: () => setInsufficient(undefined),
  };
}
