import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  annualSavingsPercent,
  featureValue,
  PLAN_FEATURES,
  type PlanTier,
  PLANS,
  RECOMMENDED_PLAN,
} from "../catalog";
import { FeatureMark, useFeatureDetail } from "./feature-mark";
import { useFormatPrice } from "./use-format-price";

// Carte d'une formule (US-03) ; le prix affiché suit la bascule Mensuel / Annuel parente.
// `children` : actions de souscription, fournies par la page.
export function PlanCard({
  tier,
  children,
}: {
  tier: PlanTier;
  children?: ReactNode;
}) {
  const t = useTranslations();
  const formatPrice = useFormatPrice();
  const featureDetail = useFeatureDetail();
  const plan = PLANS[tier];
  const isRecommended = tier === RECOMMENDED_PLAN;

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-xl border bg-card p-6 shadow-card",
        isRecommended ? "border-2 border-primary" : "border-border",
      )}
    >
      {isRecommended && (
        <span className="absolute -top-3 left-6 rounded-full bg-premium px-3 py-0.5 text-sm font-semibold text-premium-foreground">
          {t("plans.recommended")}
        </span>
      )}
      <h3 className="text-2xl font-bold">{t(`plans.names.${tier}`)}</h3>
      <p className="mt-2 text-muted-foreground">
        {t(`plans.descriptions.${tier}`)}
      </p>

      <p className="mt-6">
        <span className="group-data-[interval=year]/billing:hidden">
          <span className="text-4xl font-bold">
            {formatPrice(plan.monthlyPriceCents)}
          </span>{" "}
          <span className="text-muted-foreground">{t("plans.perMonth")}</span>
        </span>
        <span className="hidden group-data-[interval=year]/billing:inline">
          <span className="text-4xl font-bold">
            {formatPrice(plan.yearlyPriceCents)}
          </span>{" "}
          <span className="text-muted-foreground">{t("plans.perYear")}</span>
        </span>
      </p>
      <p className="mt-1 hidden text-sm font-medium text-success group-data-[interval=year]/billing:block">
        {t("pricing.savings", { percent: annualSavingsPercent(tier) })}
      </p>
      <p className="mt-3 font-semibold text-primary-strong">
        {t("plans.creditsPerMonth", { count: plan.monthlyCredits })}
      </p>

      <ul className="mt-6 space-y-3">
        {PLAN_FEATURES.map((feature) => {
          const value = featureValue(feature, tier);
          const detail = featureDetail(value);
          const label = t(`plans.features.${feature}`);
          return (
            <li key={feature} className="flex items-start gap-3">
              <FeatureMark value={value} />
              <span>
                {detail
                  ? t("plans.featureWithValue", {
                      feature: label,
                      value: detail,
                    })
                  : label}
              </span>
            </li>
          );
        })}
      </ul>
      {children ? (
        <div className="mt-auto grid gap-2 pt-8">{children}</div>
      ) : null}
    </article>
  );
}
