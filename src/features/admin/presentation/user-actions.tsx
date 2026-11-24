"use client";

import { useActionState, useState } from "react";
import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/core/action-result";
import { deleteUser, grantCredits, setBanned } from "../actions";

// Actions de l'administration sur un compte (ADR-040) : offrir des crédits, suspendre ou
// réactiver, supprimer après confirmation par l'e-mail.

const MESSAGES: Record<string, string> = {
  FORBIDDEN: "Action réservée aux administrateurs.",
  NOT_FOUND: "Ce compte n'existe plus.",
  CONFLICT: "Impossible sur votre propre compte.",
  PAYMENT_ERROR: "Stripe n'a pas pu résilier l'abonnement : réessayez.",
  VALIDATION_ERROR: "Vérifiez la valeur saisie.",
  INTERNAL: "L'action a échoué. Réessayez dans un instant.",
};

function errorOf(result: ActionResult<unknown> | null) {
  return result && !result.ok
    ? (MESSAGES[result.error.code] ?? MESSAGES.INTERNAL)
    : undefined;
}

export function GrantCreditsForm({ userId }: { userId: string }) {
  const [result, action] = useActionState(
    async (_previous: ActionResult<number> | null, formData: FormData) =>
      grantCredits(formData),
    null,
  );

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="userId" value={userId} />
      <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
        <TextField
          name="amount"
          label="Crédits"
          type="number"
          inputMode="numeric"
          min={1}
          max={500}
          defaultValue={5}
          required
        />
        <TextField
          name="note"
          label="Motif"
          optionalLabel="facultatif"
          maxLength={200}
          placeholder="Geste commercial, dédommagement…"
        />
      </div>
      {result?.ok ? (
        <FormAlert tone="success" message={`${result.data} crédits offerts.`} />
      ) : (
        <FormAlert message={errorOf(result)} />
      )}
      <SubmitButton className="justify-self-start">
        Offrir les crédits
      </SubmitButton>
    </form>
  );
}

export function BanForm({
  userId,
  banned,
}: {
  userId: string;
  banned: boolean;
}) {
  const [result, action] = useActionState(
    async (_previous: ActionResult<null> | null, formData: FormData) =>
      setBanned(formData),
    null,
  );

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="banned" value={banned ? "false" : "true"} />
      <p className="text-sm text-muted-foreground">
        {banned
          ? "Le compte est suspendu : la connexion est refusée."
          : "Un compte suspendu ne peut plus se connecter ; ses données sont gardées."}
      </p>
      <FormAlert message={errorOf(result)} />
      <SubmitButton variant="outline" className="justify-self-start">
        {banned ? "Réactiver le compte" : "Suspendre le compte"}
      </SubmitButton>
    </form>
  );
}

export function DeleteUserDialog({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [result, action] = useActionState(
    (_previous: ActionResult<never> | null, formData: FormData) =>
      deleteUser(formData),
    null,
  );

  return (
    <AlertDialog onOpenChange={() => setConfirmation("")}>
      <AlertDialogTrigger
        render={<Button variant="destructive" className="justify-self-start" />}
      >
        Supprimer le compte
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md sm:max-w-md">
        <form action={action} className="grid gap-4" noValidate>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Supprimer ce compte ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-foreground">
              Abonnement résilié, CV, contenus et crédits effacés
              définitivement. Les factures restent chez Stripe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input type="hidden" name="userId" value={userId} />
          <TextField
            name="confirmation"
            label={`Saisissez ${email} pour confirmer`}
            autoComplete="off"
            spellCheck={false}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
          <FormAlert message={errorOf(result)} />
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <SubmitButton
              variant="destructive"
              disabled={
                confirmation.trim().toLowerCase() !== email.toLowerCase()
              }
            >
              Supprimer définitivement
            </SubmitButton>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
