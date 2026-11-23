"use client";

import { useTranslations } from "next-intl";
import type { ActionResult } from "@/core/action-result";

/** Messages traduits d'une réponse d'action : message général et erreur de chaque champ. */
export function useFormErrors(result: ActionResult<unknown> | null) {
  const t = useTranslations("errors");
  const error = result && !result.ok ? result.error : undefined;

  return {
    message: error ? t(error.code) : undefined,
    field(name: string) {
      const key = error?.details?.[name];
      // Les clés viennent des schémas Zod ; le test de parité garantit leur traduction.
      return key ? t(`fields.${key}` as "fields.required") : undefined;
    },
  };
}
