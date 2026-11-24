"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import type { ActionResult } from "@/core/action-result";
import { updateProfile } from "@/features/profile/actions";

// Prénom et nom de l'administrateur (même action et mêmes règles que l'espace compte).

const FIELD_ERRORS: Record<string, string> = {
  required: "Ce champ est obligatoire.",
  tooLong: "Ce texte est trop long.",
};

type State = {
  result: ActionResult<null> | null;
  firstName: string;
  lastName: string;
};

export function AdminProfileForm({
  firstName,
  lastName,
  phone,
  city,
}: {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
}) {
  const [state, action] = useActionState(
    async (_previous: State, formData: FormData): Promise<State> => ({
      result: await updateProfile(formData),
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
    }),
    { result: null, firstName, lastName },
  );
  const error = state.result && !state.result.ok ? state.result.error : null;
  const fieldError = (name: string) => {
    const key = error?.details?.[name];
    return key ? (FIELD_ERRORS[key] ?? "Valeur invalide.") : undefined;
  };

  return (
    <form action={action} className="grid gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="firstName"
          label="Prénom"
          autoComplete="given-name"
          required
          defaultValue={state.firstName}
          error={fieldError("firstName")}
        />
        <TextField
          name="lastName"
          label="Nom"
          autoComplete="family-name"
          required
          defaultValue={state.lastName}
          error={fieldError("lastName")}
        />
      </div>
      {/* Coordonnées gardées telles quelles (non utilisées par l'administration). */}
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="city" value={city} />
      {state.result?.ok ? (
        <FormAlert tone="success" message="Profil enregistré." />
      ) : error && error.code !== "VALIDATION_ERROR" ? (
        <FormAlert message="L'enregistrement a échoué. Réessayez dans un instant." />
      ) : null}
      <SubmitButton className="justify-self-start">Enregistrer</SubmitButton>
    </form>
  );
}
