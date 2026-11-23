import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import {
  BRAND_POINTS,
  BrandAside,
  SPLIT_LAYOUT,
} from "@/components/layout/brand-aside";
import { requireUser } from "@/features/auth/session";
import { TopUpOptions } from "@/app/[locale]/_ui/top-up-options";
import { PaymentReturn } from "@/features/billing/presentation/payment-return";
import { getActivePlan } from "@/features/billing/subscription";
import { GenerationScreen } from "@/features/cv/presentation/generation-screen";
import { GenerationSteps } from "@/features/cv/presentation/generation-steps";
import { listOwnCvs } from "@/features/cv/repository";
import { planEntitlements } from "@/features/plans/entitlements";
import { pickClientMessages } from "@/i18n/client-messages";

// Une génération peut durer deux tentatives de 60 s (docs/system-design.md §9).
export const maxDuration = 150;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("generation");
  return { title: t("metaTitle"), robots: { index: false } };
}

// Génération du CV (US-11, docs/design/flows.md §3.5) : les étapes s'affichent immédiatement,
// puis l'écran lance la génération avec le brouillon du navigateur.
export default async function GenerationPage({
  searchParams,
}: PageProps<"/[locale]/creer/generation">) {
  const t = await getTranslations("generation");
  const tHome = await getTranslations("home");

  return (
    <div className="container-page py-12 md:py-16">
      <div className={SPLIT_LAYOUT}>
        <div>
          <h1 className="mb-8 text-[1.75rem] leading-tight font-bold md:text-4xl">
            {t("title")}
          </h1>
          <Suspense fallback={<GenerationSteps current={0} />}>
            <Generation searchParams={searchParams} />
          </Suspense>
        </div>
        <BrandAside points={BRAND_POINTS.map((key) => tHome(key))} />
      </div>
    </div>
  );
}

async function Generation({
  searchParams,
}: Pick<PageProps<"/[locale]/creer/generation">, "searchParams">) {
  const locale = await getLocale();
  await requireUser(locale, "/creer/generation");
  const [query, cvs, plan, messages] = await Promise.all([
    searchParams,
    listOwnCvs(),
    getActivePlan(),
    pickClientMessages([
      "ads",
      "generation",
      "errors",
      "billing",
      "creditsDialog",
    ]),
  ]);
  const screen = (
    <GenerationScreen
      cvs={cvs}
      cvLimit={planEntitlements(plan).cvLimit}
      topUp={<TopUpOptions returnTo="generation" stacked />}
    />
  );

  return (
    <NextIntlClientProvider messages={messages}>
      {/* Retour d'un achat de crédits : la génération reprend une fois l'achat confirmé. */}
      {query.paiement === "ok" || query.paiement === "annule" ? (
        <div className="grid gap-6">
          <PaymentReturn
            outcome={query.paiement}
            sessionId={
              typeof query.session_id === "string"
                ? query.session_id
                : undefined
            }
            subscription={false}
          >
            {screen}
          </PaymentReturn>
        </div>
      ) : (
        screen
      )}
    </NextIntlClientProvider>
  );
}
