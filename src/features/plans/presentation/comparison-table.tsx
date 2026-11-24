import { useTranslations } from "next-intl";
import { featureValue, PLAN_FEATURES, PLAN_TIERS, PLANS } from "../catalog";
import { FeatureMark, useFeatureDetail } from "./feature-mark";
import { useFormatPrice } from "./use-format-price";

// Tableau comparatif complet des formules (matrice des droits, INTAKE §12).
export function ComparisonTable() {
  const t = useTranslations();
  const formatPrice = useFormatPrice();
  const featureDetail = useFeatureDetail();

  const priceRows = [
    {
      key: "monthlyPrice",
      label: t("pricing.comparison.monthlyPrice"),
      values: PLAN_TIERS.map((tier) =>
        formatPrice(PLANS[tier].monthlyPriceCents),
      ),
    },
    {
      key: "yearlyPrice",
      label: t("pricing.comparison.yearlyPrice"),
      values: PLAN_TIERS.map((tier) =>
        formatPrice(PLANS[tier].yearlyPriceCents),
      ),
    },
    {
      key: "monthlyCredits",
      label: t("pricing.comparison.monthlyCredits"),
      values: PLAN_TIERS.map((tier) => String(PLANS[tier].monthlyCredits)),
    },
  ];

  return (
    <section aria-labelledby="comparatif" className="mt-20">
      <h2
        id="comparatif"
        className="text-[1.625rem] leading-tight font-bold md:text-3xl"
      >
        {t("pricing.comparison.title")}
      </h2>
      {/* Défilement horizontal limité au tableau sur petit écran, jamais à la page ; la zone est
          atteignable au clavier pour pouvoir la faire défiler (WCAG 2.1.1). « relative » : les
          textes réservés aux lecteurs d'écran (positionnés) restent dans la zone qui défile. */}
      <div
        role="region"
        aria-labelledby="comparatif"
        tabIndex={0}
        className="relative mt-6 overflow-x-auto rounded-xl border border-border"
      >
        <table className="w-full min-w-[36rem] border-collapse text-left">
          <caption className="sr-only">{t("pricing.comparison.title")}</caption>
          <thead className="bg-surface">
            <tr>
              <th scope="col" className="p-4 font-semibold">
                {t("pricing.comparison.feature")}
              </th>
              {PLAN_TIERS.map((tier) => (
                <th
                  key={tier}
                  scope="col"
                  className="p-4 text-center font-semibold"
                >
                  {t(`plans.names.${tier}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {priceRows.map((row) => (
              <tr key={row.key} className="border-t border-border">
                <th scope="row" className="p-4 font-medium">
                  {row.label}
                </th>
                {row.values.map((value, index) => (
                  <td
                    key={PLAN_TIERS[index]}
                    className="p-4 text-center font-semibold"
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
            {PLAN_FEATURES.map((feature) => (
              <tr key={feature} className="border-t border-border">
                <th scope="row" className="p-4 font-medium">
                  {t(`plans.features.${feature}`)}
                </th>
                {PLAN_TIERS.map((tier) => {
                  const value = featureValue(feature, tier);
                  const detail = featureDetail(value);
                  return (
                    <td key={tier} className="p-4">
                      <span className="flex items-center justify-center gap-2">
                        {detail ? (
                          <span className="font-semibold">{detail}</span>
                        ) : (
                          <FeatureMark value={value} />
                        )}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
