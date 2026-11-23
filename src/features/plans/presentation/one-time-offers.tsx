import { useTranslations } from "next-intl";
import { env } from "@/core/env";
import {
  ADS_REMOVAL_PRICE_CENTS,
  CREDIT_PACKS,
  CV_PRO_PRICE_CENTS,
} from "../catalog";
import { useFormatPrice } from "./use-format-price";

// Offres sans abonnement (US-03 critère 5) : packs, CV Pro et, si l'option est activée,
// suppression des publicités (H9).
export function OneTimeOffers() {
  const t = useTranslations("pricing.withoutSubscription");
  const formatPrice = useFormatPrice();

  const singlePurchases = [
    {
      key: "cvPro",
      title: t("cvPro.title"),
      description: t("cvPro.description"),
      priceCents: CV_PRO_PRICE_CENTS,
    },
    ...(env.ADS_REMOVAL_ENABLED
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
          </li>
        ))}
      </ul>
    </section>
  );
}
