import { CrownIcon, ZapIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import {
  centsToEuros,
  CREDIT_PACKS,
  CV_PRO_PRICE_CENTS,
} from "@/features/plans/catalog";
import type { ReturnTo } from "../stripe-mapping";
import { CheckoutButton } from "./checkout-button";

function usePrice() {
  const format = useFormatter();
  return (cents: number) =>
    format.number(centsToEuros(cents), { style: "currency", currency: "EUR" });
}

/**
 * Packs de crédits achetables (US-18) ; `returnTo` : page de retour après le paiement ;
 * `stacked` : les uns sous les autres (fenêtre étroite).
 */
export function CreditPackButtons({
  returnTo,
  stacked = false,
}: {
  returnTo?: ReturnTo;
  stacked?: boolean;
}) {
  const t = useTranslations("billing.topUp");
  const price = usePrice();

  return (
    <ul className={stacked ? "grid gap-2" : "grid gap-3 sm:grid-cols-3"}>
      {CREDIT_PACKS.map((pack, index) => (
        <li key={pack.id}>
          <CheckoutButton
            item={{ kind: "pack", product: pack.id }}
            returnTo={returnTo}
            variant={index === 1 ? "default" : "outline"}
            className="w-full"
          >
            <ZapIcon aria-hidden="true" />
            {t("pack", { count: pack.credits, price: price(pack.priceCents) })}
          </CheckoutButton>
        </li>
      ))}
    </ul>
  );
}

/** Déblocage d'un seul CV (US-19) : PDF et DOCX sans filigrane, pour toujours. */
export function CvProOffer({ cvId }: { cvId: string }) {
  const t = useTranslations("billing.cvPro");
  const price = usePrice();

  return (
    <section
      aria-labelledby="offre-cv-pro"
      className="grid gap-3 rounded-2xl border border-border bg-card p-5 shadow-card"
    >
      <h2
        id="offre-cv-pro"
        className="flex items-center gap-2 text-lg font-bold"
      >
        <CrownIcon aria-hidden="true" className="size-5 text-premium" />
        {t("title", { price: price(CV_PRO_PRICE_CENTS) })}
      </h2>
      <p>{t("text")}</p>
      <CheckoutButton item={{ kind: "cvPro", cvId }}>
        {t("unlock")}
      </CheckoutButton>
    </section>
  );
}
