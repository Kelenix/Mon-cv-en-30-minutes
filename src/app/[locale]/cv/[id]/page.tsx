import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import {
  CreditPackButtons,
  CvProOffer,
} from "@/features/billing/presentation/offers";
import { PaymentReturn } from "@/features/billing/presentation/payment-return";
import { getActivePlan } from "@/features/billing/subscription";
import { CvTabs } from "@/features/cv/presentation/cv-tabs";
import { CvWorkspace } from "@/features/cv/presentation/cv-workspace";
import { UpsellCard } from "@/features/cv/presentation/upsell-card";
import { getOwnCv, listGenerations } from "@/features/cv/repository";
import { PLANS, type PlanTier } from "@/features/plans/catalog";
import { canExportWithoutWatermark } from "@/features/plans/entitlements";
import { pickClientMessages } from "@/i18n/client-messages";
import { Link } from "@/i18n/navigation";

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
    <div className="container-page py-6 md:py-10">
      <Suspense fallback={<SheetSkeleton />}>
        <CvLoader params={params} searchParams={searchParams} />
      </Suspense>
    </div>
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
  await requireUser(locale, "/cv");
  const cv = await getOwnCv(id);
  const t = await getTranslations("cvEditor");

  // CV absent ou d'un autre compte (la RLS le rend introuvable).
  if (!cv) {
    return (
      <div className="mx-auto grid max-w-xl gap-6 py-10">
        <h1 className="text-[1.75rem] leading-tight font-bold">
          {t("notFound")}
        </h1>
        <Link
          href="/cv"
          className={buttonVariants({ className: "justify-self-start" })}
        >
          {t("myCvs")}
        </Link>
      </div>
    );
  }

  // Intitulés des rubriques dans la langue du CV, quelle que soit celle de l'interface (US-42).
  const sections = await getTranslations({
    locale: cv.language,
    namespace: "cvSections",
  });
  const [plan, summaries, messages] = await Promise.all([
    getActivePlan(),
    listGenerations(cv.id, "summary_variants"),
    pickClientMessages([
      "cvEditor",
      "cvExport",
      "cvTools",
      "creditsDialog",
      "upsell",
      "billing",
      "errors",
    ]),
  ]);
  const exportUnlocked = canExportWithoutWatermark(plan, cv.proUnlocked);
  const nextPlan = plan ? NEXT_PLAN[plan] : null;
  const tPlans = await getTranslations("plans");
  const tUpsell = await getTranslations("upsell");

  return (
    <NextIntlClientProvider messages={messages}>
      {query.paiement === "ok" || query.paiement === "annule" ? (
        <div className="mx-auto mb-6 max-w-[52rem]">
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
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <div className="min-w-0">
          <CvTabs cvId={cv.id} current="preview" />
          <CvWorkspace
            cvId={cv.id}
            title={cv.title}
            language={cv.language}
            initialContent={cv.content}
            exportUnlocked={exportUnlocked}
            summaryHistory={summaries.map(
              (generation) =>
                (generation.output as { variants?: string[] }).variants ?? [],
            )}
            topUp={<CreditPackButtons returnTo={{ cvId: cv.id }} stacked />}
            sectionTitles={{
              summary: sections("summary"),
              experiences: sections("experiences"),
              skills: sections("skills"),
              education: sections("education"),
              languages: sections("languages"),
            }}
          />
        </div>
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
      </div>
    </NextIntlClientProvider>
  );
}

function SheetSkeleton() {
  return (
    <div aria-hidden="true" className="mx-auto grid w-full max-w-[52rem] gap-4">
      <div className="h-16 rounded-xl bg-surface motion-safe:animate-pulse" />
      <div className="aspect-[210/297] rounded-sm bg-surface motion-safe:animate-pulse" />
    </div>
  );
}
