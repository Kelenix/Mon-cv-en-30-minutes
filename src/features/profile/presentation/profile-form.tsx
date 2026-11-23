"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { useFormErrors } from "@/components/form/use-form-errors";
import type { ActionResult } from "@/core/action-result";
import { updateProfile } from "../actions";
import type { ProfileValues } from "../schemas";

type ProfileState = {
  result: ActionResult<null> | null;
  values: ProfileValues;
};

/** Nom et coordonnées par défaut, repris dans l'en-tête des nouveaux CV (US-05 c.2). */
export function ProfileForm({
  initialValues,
}: {
  initialValues: ProfileValues;
}) {
  const t = useTranslations();
  const [state, action] = useActionState(
    async (
      _previous: ProfileState,
      formData: FormData,
    ): Promise<ProfileState> => ({
      result: await updateProfile(formData),
      // Les champs gardent la saisie après l'envoi, y compris en cas d'erreur.
      values: {
        firstName: String(formData.get("firstName") ?? ""),
        lastName: String(formData.get("lastName") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        city: String(formData.get("city") ?? ""),
      },
    }),
    { result: null, values: initialValues },
  );
  const errors = useFormErrors(state.result);
  const optional = t("profile.optional");

  return (
    <form action={action} className="grid gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
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
        <TextField
          name="phone"
          type="tel"
          label={t("profile.phone")}
          optionalLabel={optional}
          autoComplete="tel"
          defaultValue={state.values.phone}
          error={errors.field("phone")}
        />
        <TextField
          name="city"
          label={t("profile.city")}
          optionalLabel={optional}
          autoComplete="address-level2"
          defaultValue={state.values.city}
          error={errors.field("city")}
        />
      </div>
      {state.result?.ok ? (
        <FormAlert tone="success" message={t("account.saved")} />
      ) : (
        <FormAlert message={errors.message} />
      )}
      <SubmitButton className="justify-self-start">
        {t("account.save")}
      </SubmitButton>
    </form>
  );
}
