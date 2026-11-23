"use client";

import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
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
import { deleteCv } from "../actions";

/** Suppression d'un CV après confirmation (US-31 c.5), contenus générés compris. */
export function DeleteCvDialog({
  cvId,
  title,
  proUnlocked,
}: {
  cvId: string;
  title: string;
  proUnlocked: boolean;
}) {
  const t = useTranslations("cvList.delete");
  const tErrors = useTranslations("errors");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await deleteCv({ cvId });
      // Succès : la liste est relue et ce CV disparaît avec sa fenêtre.
      if (!result.ok) setError(tErrors(result.error.code));
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setError(undefined);
      }}
    >
      <AlertDialogTrigger
        render={<Button variant="ghost" aria-label={t("button", { title })} />}
      >
        <Trash2Icon aria-hidden="true" />
        <span className="max-sm:sr-only">{t("short")}</span>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            {t("title", { title })}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-foreground">
            {t("description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {proUnlocked ? <p>{t("proLost")}</p> : null}
        {error ? (
          <p role="alert" className="font-medium text-destructive">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={confirm}
            disabled={pending}
            aria-busy={pending || undefined}
          >
            {t("confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
