"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { useFormErrors } from "@/components/form/use-form-errors";
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
import { deleteAccount } from "../actions";
import { DELETE_CONFIRMATION_WORDS } from "../delete-confirmation";

/**
 * Suppression du compte (US-06) : récapitulatif de ce qui sera perdu, puis saisie du mot de
 * confirmation dans la langue de l'interface.
 */
export function DeleteAccountDialog() {
  const t = useTranslations("account.delete");
  const locale = useLocale();
  const word = DELETE_CONFIRMATION_WORDS[locale];
  const [confirmation, setConfirmation] = useState("");
  const [result, action] = useActionState(
    (_previous: ActionResult<never> | null, formData: FormData) =>
      deleteAccount(formData),
    null,
  );
  const errors = useFormErrors(result);

  return (
    <AlertDialog onOpenChange={() => setConfirmation("")}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        {t("button")}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md sm:max-w-md">
        <form action={action} className="grid gap-4" noValidate>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              {t("title")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-foreground">
              {t("description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="list-disc ps-6 text-base">
            <li>{t("lossCvs")}</li>
            <li>{t("lossCredits")}</li>
            <li>{t("lossSubscription")}</li>
          </ul>
          <input type="hidden" name="locale" value={locale} />
          <TextField
            name="confirmation"
            label={t("confirmLabel", { word })}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            error={errors.field("confirmation")}
          />
          {result && !result.ok && result.error.code !== "VALIDATION_ERROR" ? (
            <FormAlert message={errors.message} />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <SubmitButton
              variant="destructive"
              disabled={confirmation.trim().toLocaleUpperCase(locale) !== word}
            >
              {t("confirm")}
            </SubmitButton>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
