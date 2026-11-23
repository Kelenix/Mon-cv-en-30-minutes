"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import type { FieldErrors } from "@/core/action-result";
import type { OperationKey } from "@/features/plans/catalog";
import { Link } from "@/i18n/navigation";

/**
 * Fenêtre « Solde insuffisant » (US-08, US-09, docs/design/flows.md §3.8) : crédits manquants,
 * recharge sur place (`topUp`, fournie par la page) ou passage à Pro ; pour Essential, rappel
 * que la fonction se paie en crédits achetés.
 */
export function CreditsDialog({
  open,
  onOpenChange,
  operation,
  details,
  topUp,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation: OperationKey;
  details?: FieldErrors;
  topUp?: ReactNode;
}) {
  const t = useTranslations("creditsDialog");
  const cost = Number(details?.cost ?? 0);
  const missing = Number(details?.missing ?? 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            {t("title", { missing })}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-foreground">
            {t("description", {
              operation: t(`operations.${operation}`),
              cost,
              balance: cost - missing,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {details?.purchasedOnly === "true" ? (
          <p className="rounded-lg bg-surface px-4 py-3">
            {t("purchasedOnly")}
          </p>
        ) : null}
        {topUp}
        <AlertDialogFooter className="sm:flex-wrap">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Link
            href={{ pathname: "/tarifs", hash: "formules" }}
            className={buttonVariants({ variant: "outline" })}
          >
            {t("upgrade")}
          </Link>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
