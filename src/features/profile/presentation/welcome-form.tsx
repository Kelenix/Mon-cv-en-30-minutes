"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { useFormErrors } from "@/components/form/use-form-errors";
import type { ActionResult } from "@/core/action-result";
import { completeProfile } from "../actions";

type WelcomeState = {
  result: ActionResult<never> | null;
  values: { firstName: string; lastName: string };
};

/** Première connexion : « Comment t'appelles-tu ? » (US-04 c.2, H18). */
export function WelcomeForm({
  defaults,
  next,
}: {
  defaults: WelcomeState["values"];
  next: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [state, action] = useActionState(
    async (
      _previous: WelcomeState,
      formData: FormData,
    ): Promise<WelcomeState> => ({
      result: await completeProfile(formData),
      values: {
        firstName: String(formData.get("firstName") ?? ""),
        lastName: String(formData.get("lastName") ?? ""),
      },
    }),
    { result: null, values: defaults },
  );
  const errors = useFormErrors(state.result);

  return (
    <form action={action} className="grid gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next} />
      <TextField
        name="firstName"
        label={t("profile.firstName")}
        autoComplete="given-name"
        required
        defaultValue={state.values.firstName}
        error={errors.field("firstName")}
      />
      <TextField
        name="lastName"
        label={t("profile.lastName")}
        autoComplete="family-name"
        required
        defaultValue={state.values.lastName}
        error={errors.field("lastName")}
      />
      <FormAlert message={errors.message} />
      <SubmitButton size="lg">{t("welcome.continue")}</SubmitButton>
    </form>
  );
}
