"use client";

import { ExternalLinkIcon, Loader2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useHydrated } from "@/components/form/use-hydrated";
import { Button } from "@/components/ui/button";
import { openBillingPortal } from "../actions";

/** « Gérer mon abonnement » : portail client Stripe (US-22). */
export function PortalButton() {
  const t = useTranslations("billing.plan");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const hydrated = useHydrated();
  const [pending, startTransition] = useTransition();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string>();
  const busy = pending || redirecting;

  return (
    <div className="grid justify-items-start gap-2">
      <Button
        variant="outline"
        disabled={!hydrated || busy}
        aria-busy={busy || undefined}
        onClick={() =>
          startTransition(async () => {
            setError(undefined);
            const result = await openBillingPortal(locale);
            if (result.ok) {
              setRedirecting(true);
              window.location.assign(result.data.url);
            } else {
              setError(tErrors(result.error.code));
            }
          })
        }
      >
        {busy ? (
          <Loader2Icon
            aria-hidden="true"
            className="motion-safe:animate-spin"
          />
        ) : (
          <ExternalLinkIcon aria-hidden="true" />
        )}
        {t("manage")}
      </Button>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
