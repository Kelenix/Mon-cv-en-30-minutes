import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import {
  maxAnnualSavingsPercent,
  PLAN_TIERS,
  TRIAL,
} from "@/features/plans/catalog";
import { BillingToggle } from "@/features/plans/presentation/billing-toggle";
import { ComparisonTable } from "@/features/plans/presentation/comparison-table";
import { OneTimeOffers } from "@/features/plans/presentation/one-time-offers";
import { OperationCosts } from "@/features/plans/presentation/operation-costs";
import { PlanCard } from "@/features/plans/presentation/plan-card";
import { pageMetadata } from "@/i18n/metadata";
import { Link } from "@/i18n/navigation";

export async function generateMetadata() {
  const t = await getTranslations("pricing");
  return pageMetadata({
    pathname: "/tarifs",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

// Page Tarifs (US-03, INTAKE §12 et §15). La souscription est branchée à l'Inc-6 (paiements).
export default function PricingPage() {
  const t = useTranslations("pricing");

  return (
    <div className="container-page py-12 md:py-16">
      <h1 className="text-[2rem] leading-[1.15] font-bold md:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        {t("subtitle")}
      </p>
      <Link href="/creer" className={`${buttonVariants({ size: "lg" })} mt-6`}>
        {t("startFree")}
      </Link>

      <section aria-labelledby="formules" className="mt-12">
        <h2 id="formules" className="sr-only">
          {t("comparison.title")}
        </h2>
        <BillingToggle
          labels={{
            group: t("billing.label"),
            month: t("billing.monthly"),
            year: t("billing.yearly"),
            yearlyHint: t("billing.yearlyHint", {
              percent: maxAnnualSavingsPercent(),
            }),
          }}
        >
          <ul className="mt-10 grid gap-8 lg:grid-cols-3">
            {PLAN_TIERS.map((tier) => (
              <li key={tier}>
                <PlanCard tier={tier} />
              </li>
            ))}
          </ul>
        </BillingToggle>
        <p className="mt-6 font-medium">
          {t("conditions", { days: TRIAL.days, credits: TRIAL.credits })}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{t("pricesNote")}</p>
      </section>

      <OneTimeOffers />
      <ComparisonTable />
      <OperationCosts />
    </div>
  );
}
