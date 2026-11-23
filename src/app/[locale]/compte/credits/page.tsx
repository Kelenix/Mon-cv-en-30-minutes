import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Appear } from "@/components/layout/appear";
import { SplitSkeleton } from "@/components/form/form-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { PlanCheckoutButton } from "@/features/billing/presentation/checkout-button";
import { CreditPackButtons } from "@/features/billing/presentation/offers";
import { PaymentReturn } from "@/features/billing/presentation/payment-return";
import { PortalButton } from "@/features/billing/presentation/portal-button";
import {
  getCurrentSubscription,
  type Subscription,
} from "@/features/billing/subscription";
import { getCurrentWallet } from "@/features/credits/wallet";
import { centsToEuros, productCredits, TRIAL } from "@/features/plans/catalog";
import { OperationCosts } from "@/features/plans/presentation/operation-costs";
import { getOwnProfile } from "@/features/profile/data/profile-repository";
import { pickClientMessages } from "@/i18n/client-messages";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("billing");
  return { title: t("metaTitle"), robots: { index: false } };
}

// Crédits et formule (US-07, US-18 à US-23, docs/design/flows.md §3.7) : formule et portail,
// soldes, recharge, coûts, achats ; retour de paiement.
export default async function CreditsPage({
  searchParams,
}: PageProps<"/[locale]/compte/credits">) {
  const t = await getTranslations("billing");

  return (
    <div className="container-page py-12 md:py-16">
      <h1 className="text-[1.75rem] leading-tight font-bold md:text-4xl">
        {t("title")}
      </h1>
      <Suspense
        fallback={
          <SplitSkeleton
            fields={3}
            className="mt-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
          />
        }
      >
        <Appear>
          <Credits searchParams={searchParams} />
        </Appear>
      </Suspense>
    </div>
  );
}

const sectionClass = "mt-10 border-t border-border pt-8";
const headingClass = "text-xl font-semibold md:text-2xl";

async function Credits({
  searchParams,
}: Pick<PageProps<"/[locale]/compte/credits">, "searchParams">) {
  const locale = await getLocale();
  const user = await requireUser(locale, "/compte/credits");
  const supabase = await createClient();
  const [query, wallet, subscription, profile, purchases, messages] =
    await Promise.all([
      searchParams,
      getCurrentWallet(),
      getCurrentSubscription(),
      getOwnProfile(supabase, user.id),
      supabase
        .from("purchases")
        .select("id, product, amount_cents, currency, created_at, cvs(title)")
        .order("created_at", { ascending: false }),
      pickClientMessages(["billing", "errors"]),
    ]);
  const t = await getTranslations("billing");
  const tPlans = await getTranslations("plans");
  const format = await getFormatter();
  const date = (value: string) =>
    format.dateTime(new Date(value), { dateStyle: "long" });
  const outcome = query.paiement;

  return (
    <NextIntlClientProvider messages={messages}>
      {outcome === "ok" || outcome === "annule" ? (
        <div className="mt-6">
          <PaymentReturn
            outcome={outcome}
            sessionId={
              typeof query.session_id === "string"
                ? query.session_id
                : undefined
            }
            subscription={query.abonnement === "1"}
          />
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-8">
        <section
          aria-labelledby="formule"
          className="rounded-2xl border border-border p-6 md:p-8"
        >
          <h2 id="formule" className={headingClass}>
            {t("plan.title")}
          </h2>
          {subscription ? (
            <div className="mt-4 grid justify-items-start gap-3">
              <p className="text-lg font-semibold">
                {tPlans(`names.${subscription.plan}`)} ·{" "}
                {t(`plan.intervals.${subscription.interval}`)}
              </p>
              <p>{statusLine(subscription, t, date)}</p>
              <PortalButton />
            </div>
          ) : (
            <div className="mt-4 grid justify-items-start gap-3">
              <p className="text-lg font-semibold">{t("plan.none")}</p>
              <p className="text-muted-foreground">{t("plan.noneHint")}</p>
              {profile.trial_used_at ? null : (
                <div className="grid gap-2">
                  <PlanCheckoutButton tier={TRIAL.plan} trial>
                    {t("checkout.trial", { days: TRIAL.days })}
                  </PlanCheckoutButton>
                  <p className="text-sm text-muted-foreground">
                    {t("checkout.trialTerms", {
                      days: TRIAL.days,
                      credits: TRIAL.credits,
                    })}
                  </p>
                </div>
              )}
              <Link
                href="/tarifs"
                className={buttonVariants({ variant: "outline" })}
              >
                {t("plan.seePlans")}
              </Link>
            </div>
          )}
        </section>

        {wallet ? (
          <section
            aria-labelledby="credits"
            className="rounded-2xl border border-border p-6 md:p-8"
          >
            <h2 id="credits" className={headingClass}>
              {t("credits.title")}
            </h2>
            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-surface p-4">
                <dt className="font-medium">{t("credits.total")}</dt>
                <dd className="mt-1 text-3xl font-bold">{wallet.total}</dd>
              </div>
              <div className="rounded-xl border border-border p-4">
                <dt className="font-medium">{t("credits.included")}</dt>
                <dd className="mt-1 text-3xl font-bold">{wallet.included}</dd>
                {subscription?.nextCreditGrantAt ? (
                  <dd className="mt-1 text-sm text-muted-foreground">
                    {t("credits.includedReset", {
                      count: subscription.monthlyCredits,
                      date: date(subscription.nextCreditGrantAt),
                    })}
                  </dd>
                ) : null}
              </div>
              <div className="rounded-xl border border-border p-4">
                <dt className="font-medium">{t("credits.purchased")}</dt>
                <dd className="mt-1 text-3xl font-bold">{wallet.purchased}</dd>
                <dd className="mt-1 text-sm text-muted-foreground">
                  {t("credits.purchasedHint")}
                </dd>
              </div>
            </dl>
          </section>
        ) : null}
      </div>

      <section aria-labelledby="recharger" className={sectionClass}>
        <h2 id="recharger" className={headingClass}>
          {t("topUp.title")}
        </h2>
        <div className="mt-6">
          <CreditPackButtons />
        </div>
      </section>

      <OperationCosts />

      {purchases.data && purchases.data.length > 0 ? (
        <section aria-labelledby="achats" className={sectionClass}>
          <h2 id="achats" className={headingClass}>
            {t("purchases.title")}
          </h2>
          <ul className="mt-6 grid gap-2">
            {purchases.data.map((purchase) => (
              <li
                key={purchase.id}
                className="flex flex-wrap justify-between gap-x-6 gap-y-1 rounded-xl border border-border p-4"
              >
                <span className="font-medium">
                  {purchase.product === "cv_pro"
                    ? t("purchases.cvPro", {
                        title: purchase.cvs?.title ?? t("purchases.cvDeleted"),
                      })
                    : purchase.product === "ads_removal"
                      ? t("purchases.adsRemoval")
                      : t("purchases.pack", {
                          count: productCredits(purchase.product),
                        })}
                </span>
                <span className="text-muted-foreground">
                  {date(purchase.created_at)} ·{" "}
                  {format.number(centsToEuros(purchase.amount_cents), {
                    style: "currency",
                    currency: purchase.currency.toUpperCase(),
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </NextIntlClientProvider>
  );
}

/** Échéance de la formule : essai, paiement en attente, fin programmée ou renouvellement. */
function statusLine(
  subscription: Subscription,
  t: Awaited<ReturnType<typeof getTranslations<"billing">>>,
  date: (value: string) => string,
) {
  if (subscription.status === "trialing" && subscription.trialEndsAt) {
    return t("plan.trialEnds", { date: date(subscription.trialEndsAt) });
  }
  if (subscription.status === "past_due") return t("plan.pastDue");
  return subscription.cancelAtPeriodEnd
    ? t("plan.ends", { date: date(subscription.currentPeriodEnd) })
    : t("plan.renews", { date: date(subscription.currentPeriodEnd) });
}
