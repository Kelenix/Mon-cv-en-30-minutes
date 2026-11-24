import "server-only";
import { getLocale, getTranslations } from "next-intl/server";
import logoFr from "@/assets/brand/logo-fr.png";
import { env } from "@/core/env";
import {
  CREDIT_PACKS,
  CV_PRO_PRICE_CENTS,
  centsToEuros,
  PLAN_TIERS,
  PLANS,
} from "@/features/plans/catalog";
import { getPathname } from "@/i18n/navigation";

// Données structurées de l'accueil et des tarifs (US-39 c.1), dans la langue de la page : l'éditeur,
// le site et l'application, avec ses offres réelles (prix du catalogue).

const site = env.NEXT_PUBLIC_SITE_URL;
const euros = (cents: number) => centsToEuros(cents).toFixed(2);

async function application(pathname: "/" | "/tarifs") {
  const locale = await getLocale();
  const t = await getTranslations();
  return {
    locale,
    t,
    node: {
      "@type": "WebApplication",
      name: t("brand.name"),
      url: `${site}${getPathname({ locale, href: pathname })}`,
      description: t("metadata.description"),
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: locale,
      publisher: { "@id": `${site}/#editeur` },
    },
  };
}

const free = (description: string) => ({
  "@type": "Offer",
  price: "0",
  priceCurrency: "EUR",
  description,
});

export async function homeStructuredData() {
  const { locale, t, node } = await application("/");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site}/#editeur`,
        name: t("brand.name"),
        url: site,
        logo: `${site}${logoFr.src}`,
      },
      {
        "@type": "WebSite",
        name: t("brand.name"),
        url: `${site}${getPathname({ locale, href: "/" })}`,
        inLanguage: locale,
        publisher: { "@id": `${site}/#editeur` },
      },
      { ...node, offers: free(t("home.highlights.freeFirstCv")) },
    ],
  };
}

export async function pricingStructuredData() {
  const { t, node } = await application("/tarifs");
  const offer = (name: string, cents: number) => ({
    "@type": "Offer",
    name,
    price: euros(cents),
    priceCurrency: "EUR",
  });
  return {
    "@context": "https://schema.org",
    ...node,
    offers: [
      free(t("home.highlights.freeFirstCv")),
      ...PLAN_TIERS.map((tier) => ({
        ...offer(t(`plans.names.${tier}`), PLANS[tier].monthlyPriceCents),
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: euros(PLANS[tier].monthlyPriceCents),
          priceCurrency: "EUR",
          billingDuration: "P1M",
        },
      })),
      offer(t("pricing.withoutSubscription.cvPro.title"), CV_PRO_PRICE_CENTS),
      ...CREDIT_PACKS.map((pack) =>
        offer(t("credits.count", { count: pack.credits }), pack.priceCents),
      ),
    ],
  };
}
