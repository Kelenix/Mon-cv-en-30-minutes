import { getTranslations } from "next-intl/server";
import { FeatureGrid } from "@/features/marketing/presentation/feature-grid";
import { FinalCta } from "@/features/marketing/presentation/final-cta";
import { Hero } from "@/features/marketing/presentation/hero";
import { OffersOverview } from "@/features/marketing/presentation/offers-overview";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return pageMetadata({ pathname: "/", description: t("description") });
}

// Accueil (US-01 à US-03).
export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <OffersOverview />
      <FinalCta />
    </>
  );
}
