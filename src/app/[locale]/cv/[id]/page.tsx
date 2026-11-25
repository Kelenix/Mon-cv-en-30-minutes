import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Appear } from "@/components/layout/appear";
import { requireUser } from "@/features/auth/session";
import { TopUpOptions } from "@/app/[locale]/_ui/top-up-options";
import { getAdsAudience } from "@/features/ads/audience";
import { InterstitialOnLeave } from "@/features/ads/presentation/interstitial";
import { ReferralCard } from "@/features/acquisition/presentation/referral-card";
import { getOwnReferral } from "@/features/acquisition/referrals";
import { REFERRAL_CREDITS } from "@/features/acquisition/server";
import { CvProOffer } from "@/features/billing/presentation/offers";
import { PaymentReturn } from "@/features/billing/presentation/payment-return";
import { getActivePlan } from "@/features/billing/subscription";
import { defaultCountry, isCountry } from "@/features/cv/countries";
import { hasOwnCvPhoto } from "@/features/cv/photo";
import { CvNotFound } from "@/features/cv/presentation/cv-not-found";
import { CvWorkspace } from "@/features/cv/presentation/cv-workspace";
import { UpsellCard } from "@/features/cv/presentation/upsell-card";
import { getOwnCv, listGenerations } from "@/features/cv/repository";
import { PLANS, type PlanTier } from "@/features/plans/catalog";
import { canExportWithoutWatermark } from "@/features/plans/entitlements";
import { pickClientMessages } from "@/i18n/client-messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cvEditor");
  return { title: t("metaTitle"), robots: { index: false } };
}

// Aperçu, éditeur et exports d'un CV (US-12 à US-17, docs/design/flows.md §3.6). Aucune
// publicité.
export default function CvPage({
  params,
  searchParams,
}: PageProps<"/[locale]/cv/[id]">) {
  return (
    <Suspense fallback={<SheetSkeleton />}>
      <Appear>
        <CvLoader params={params} searchParams={searchParams} />
      </Appear>
    </Suspense>
  );
}

/** Formule supérieure proposée à un abonné (US-15 c.3) ; aucune au-delà de Premium. */
const NEXT_PLAN: Record<PlanTier, PlanTier | null> = {
  essential: "pro",
  pro: "premium",
  premium: null,
};

async function CvLoader({
  params,
  searchParams,
}: Omit<PageProps<"/[locale]/cv/[id]">, "children">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = await getLocale();
  const user = await requireUser(locale, "/cv");
  const cv = await getOwnCv(id);

  if (!cv) return <CvNotFound />;

  // Intitulés des rubriques dans la langue du CV, quelle que soit celle de l'interface (US-42).
  const sections = await getTranslations({
    locale: cv.language,
    namespace: "cvSections",
  });
  const [plan, summaries, audience, hasPhoto, referral, messages] =
    await Promise.all([
      getActivePlan(),
      listGenerations(cv.id, "summary_variants"),
      getAdsAudience(),
      hasOwnCvPhoto(cv.id),
      getOwnReferral(user.id, locale),
      pickClientMessages([
        "ads",
        "cvEditor",
        "cvExport",
        "cvTemplates",
        "cvTools",
        "creditsDialog",
        "upsell",
        "billing",
        "errors",
        "referral",
      ]),
    ]);
  const exportUnlocked = canExportWithoutWatermark(plan, cv.proUnlocked);
  const nextPlan = plan ? NEXT_PLAN[plan] : null;
  // Colonne des offres seulement s'il y a quelque chose à proposer (sinon, pleine largeur).
  const hasOffers = !exportUnlocked || plan === null || nextPlan !== null;
  const tPlans = await getTranslations("plans");
  const tUpsell = await getTranslations("upsell");

  return (
    <NextIntlClientProvider messages={messages}>
      {/* Interstitiel unique en quittant l'aperçu (US-34), jamais affiché sur l'aperçu. */}
      {audience.config && audience.interstitial ? (
        <InterstitialOnLeave config={audience.config} cvId={cv.id} />
      ) : null}
      {query.paiement === "ok" || query.paiement === "annule" ? (
        <div className="mb-6">
          <PaymentReturn
            outcome={query.paiement}
            sessionId={
              typeof query.session_id === "string"
                ? query.session_id
                : undefined
            }
            subscription={false}
          />
        </div>
      ) : null}
      <div
        className={
          hasOffers
            ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start"
            : "grid gap-6"
        }
      >
        <div className="min-w-0">
          <CvWorkspace
            cvId={cv.id}
            title={cv.title}
            language={cv.language}
            initialContent={cv.content}
            initialTemplate={cv.template}
            country={
              isCountry(cv.targetCountry)
                ? cv.targetCountry
                : defaultCountry(cv.language)
            }
            hasPhoto={hasPhoto}
            exportUnlocked={exportUnlocked}
            summaryHistory={summaries.map(
              (generation) =>
                (generation.output as { variants?: string[] }).variants ?? [],
            )}
            topUp={<TopUpOptions returnTo={{ cvId: cv.id }} stacked />}
            sectionTitles={{
              summary: sections("summary"),
              experiences: sections("experiences"),
              skills: sections("skills"),
              education: sections("education"),
              languages: sections("languages"),
            }}
          />
        </div>
        {hasOffers ? (
          <div className="grid gap-6 xl:sticky xl:top-6">
            {exportUnlocked ? null : <CvProOffer cvId={cv.id} />}
            {plan === null ? <UpsellCard /> : null}
            {plan && nextPlan ? (
              <UpsellCard
                upgrade={{
                  title: tUpsell("upgradeTitle", {
                    plan: tPlans(`names.${nextPlan}`),
                  }),
                  text: tUpsell("upgradeText", {
                    count: PLANS[nextPlan].monthlyCredits,
                    current: PLANS[plan].monthlyCredits,
                  }),
                }}
              />
            ) : null}
          </div>
        ) : null}
      </div>
      {/* Après le CV : l'inviter à le faire connaître (parrainage, ADR-052). */}
      {referral ? (
        <ReferralCard
          className="mt-6"
          link={referral.link}
          credits={REFERRAL_CREDITS}
        />
      ) : null}
    </NextIntlClientProvider>
  );
}

function SheetSkeleton() {
  return (
    <div aria-hidden="true" className="grid w-full skeleton-appear gap-4">
      <div className="h-16 rounded-xl bg-surface motion-safe:animate-pulse" />
      <div className="aspect-[210/297] rounded-sm bg-surface motion-safe:animate-pulse" />
    </div>
  );
}
