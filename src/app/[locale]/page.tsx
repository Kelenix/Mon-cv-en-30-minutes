import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { StructuredData } from "@/components/seo/structured-data";
import { AdBanner } from "@/features/ads/presentation/ad-banner";
import { FeatureGrid } from "@/features/marketing/presentation/feature-grid";
import { FinalCta } from "@/features/marketing/presentation/final-cta";
import { Hero } from "@/features/marketing/presentation/hero";
import { OffersOverview } from "@/features/marketing/presentation/offers-overview";
import { TemplatesSection } from "@/features/marketing/presentation/templates-section";
import { homeStructuredData } from "@/features/marketing/structured-data";
import { AccountDeletedNotice } from "@/features/profile/presentation/account-deleted-notice";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return pageMetadata({ pathname: "/", description: t("description") });
}

// Accueil (US-01 à US-03).
export default async function HomePage() {
  const t = await getTranslations("account");

  return (
    <>
      <StructuredData data={await homeStructuredData()} />
      {/* Lu dans le navigateur : la page reste générée au build. */}
      <Suspense>
        <AccountDeletedNotice message={t("deletedNotice")} />
      </Suspense>
      <Hero />
      <FeatureGrid />
      <TemplatesSection />
      <OffersOverview />
      <FinalCta />
      <Suspense>
        <AdBanner format="banner" className="container-page py-8" />
      </Suspense>
    </>
  );
}
