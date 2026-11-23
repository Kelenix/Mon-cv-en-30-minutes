"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { createCheckoutSession } from "../actions";
import type { CheckoutItem } from "../stripe-mapping";

/**
 * Lance un paiement Stripe Checkout : redirection vers Stripe, ou vers la connexion pour un
 * visiteur (retour ensuite sur la page en cours), ou message d'erreur traduit.
 */
export function useCheckout() {
  const locale = useLocale();
  const t = useTranslations("billing.conflict");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string>();

  function start(item: CheckoutItem, returnTo?: "credits" | "generation") {
    setError(undefined);
    startTransition(async () => {
      const result = await createCheckoutSession({ locale, item, returnTo });
      if (result.ok) {
        setRedirecting(true);
        window.location.assign(result.data.url);
      } else if (result.error.code === "UNAUTHENTICATED") {
        router.push({
          pathname: "/connexion",
          query: { next: window.location.pathname },
        });
      } else {
        const reason = result.error.details?.reason;
        setError(
          reason ? t(reason as "subscribed") : tErrors(result.error.code),
        );
      }
    });
  }

  return { start, busy: pending || redirecting, error };
}
