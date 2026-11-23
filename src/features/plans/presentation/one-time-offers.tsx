import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { env } from "@/core/env";
import {
  ADS_REMOVAL_PRICE_CENTS,
  CREDIT_PACKS,
  type CreditPackId,
  CV_PRO_PRICE_CENTS,
} from "../catalog";
import { useFormatPrice } from "./use-format-price";

// Offres sans abonnement (US-03 critère 5) : packs, CV Pro et, si l'option est activée,
// suppression des publicités (H9). Les actions d'achat sont fournies par la page.
export function OneTimeOffers({
  packAction,
  cvProNote,
}: {
  packAction?: (pack: CreditPackId) => ReactNode;
  cvProNote?: ReactNode;
}) {
  const t = useTranslations("pricing.withoutSubscription");
  const formatPrice = useFormatPrice();

  const singlePurchases = [
    {
      key: "cvPro",
      title: t("cvPro.title"),
      description: t("cvPro.description"),
      priceCents: CV_PRO_PRICE_CENTS,
    },
    ...(env.ADS_MODE !== "off" && env.ADS_REMOVAL_ENABLED
      ? [
          {
            key: "adsRemoval",
            title: t("adsRemoval.title"),
            description: t("adsRemoval.description"),
            priceCents: ADS_REMOVAL_PRICE_CENTS,
          },
        ]
      : []),
  ];

  return (
    <section aria-labelledby="sans-abonnement" className="mt-20">
      <h2
        id="sans-abonnement"
        className="text-[1.625rem] leading-tight font-bold md:text-3xl"
      >
        {t("title")}
      </h2>
      <p className="mt-2 text-lg text-muted-foreground">{t("subtitle")}</p>

      <h3 className="mt-8 text-xl font-semibold">{t("packs")}</h3>
      <ul className="mt-4 grid gap-4 sm:grid-cols-3">
        {CREDIT_PACKS.map((pack) => (
          <li
            key={pack.id}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <p className="text-lg font-semibold">
              {t("packCredits", { count: pack.credits })}
            </p>
            <p className="mt-1 text-2xl font-bold">
              {formatPrice(pack.priceCents)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t("oneTime")}</p>
            {packAction ? (
              <div className="mt-4">{packAction(pack.id)}</div>
            ) : null}
          </li>
        ))}
      </ul>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {singlePurchases.map((offer) => (
          <li
            key={offer.key}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <h3 className="text-xl font-semibold">{offer.title}</h3>
            <p className="mt-1 text-2xl font-bold">
              {formatPrice(offer.priceCents)}
            </p>
            <p className="mt-2 text-muted-foreground">{offer.description}</p>
            {offer.key === "cvPro" && cvProNote ? (
              <p className="mt-2 font-medium">{cvProNote}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
