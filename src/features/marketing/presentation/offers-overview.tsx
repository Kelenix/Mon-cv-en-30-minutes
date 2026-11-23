import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import {
  cheapestPackPriceCents,
  CV_PRO_PRICE_CENTS,
  PLAN_TIERS,
  PLANS,
  RECOMMENDED_PLAN,
} from "@/features/plans/catalog";
import { useFormatPrice } from "@/features/plans/presentation/use-format-price";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Offer = {
  key: string;
  name: string;
  price: string;
  detail: string;
  isRecommended?: boolean;
};

// Aperçu des offres sur l'accueil (US-03, INTAKE §4.3 revu par ADR-001).
export function OffersOverview() {
  const t = useTranslations();
  const formatPrice = useFormatPrice();

  const offers: Offer[] = [
    {
      key: "free",
      name: t("home.offers.free.name"),
      price: formatPrice(0),
      detail: t("home.offers.free.description"),
    },
    {
      key: "credits",
      name: t("home.offers.credits.name"),
      price: t("home.offers.priceFrom", {
        price: formatPrice(cheapestPackPriceCents()),
      }),
      detail: t("home.offers.credits.description"),
    },
    ...PLAN_TIERS.map((tier) => ({
      key: tier,
      name: t(`plans.names.${tier}`),
      price: `${formatPrice(PLANS[tier].monthlyPriceCents)} ${t("plans.perMonth")}`,
      detail: t("plans.creditsPerMonth", { count: PLANS[tier].monthlyCredits }),
      isRecommended: tier === RECOMMENDED_PLAN,
    })),
    {
      key: "cvPro",
      name: t("home.offers.cvPro.name"),
      price: formatPrice(CV_PRO_PRICE_CENTS),
      detail: t("home.offers.cvPro.description"),
    },
  ];

  return (
    <section aria-labelledby="offres" className="bg-surface">
      <div className="container-page py-16 md:py-24">
        <h2
          id="offres"
          className="text-[1.625rem] leading-tight font-bold md:text-4xl"
        >
          {t("home.offers.title")}
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          {t("home.offers.subtitle")}
        </p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <li
              key={offer.key}
              className={cn(
                "relative flex flex-col rounded-xl border bg-card p-6 shadow-card",
                offer.isRecommended
                  ? "border-2 border-primary"
                  : "border-transparent",
              )}
            >
              {offer.isRecommended && (
                <span className="absolute -top-3 left-6 rounded-full bg-premium px-3 py-0.5 text-sm font-semibold text-premium-foreground">
                  {t("plans.recommended")}
                </span>
              )}
              <h3 className="text-xl font-semibold">{offer.name}</h3>
              <p className="mt-2 text-2xl font-bold">{offer.price}</p>
              <p className="mt-2 text-muted-foreground">{offer.detail}</p>
            </li>
          ))}
        </ul>
        <Link
          href="/tarifs"
          className={cn(buttonVariants({ variant: "outline" }), "mt-10")}
        >
          {t("home.offers.seeAll")}
        </Link>
      </div>
    </section>
  );
}
