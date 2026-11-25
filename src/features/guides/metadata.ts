import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { GUIDE_LOCALES } from "./catalog";
import type { Guide } from "./types";

const OG_LOCALES: Record<AppLocale, string> = {
  fr: "fr_FR",
  en: "en_GB",
  it: "it_IT",
  es: "es_ES",
  de: "de_DE",
};

/** Partage (Open Graph) avec l'image de la langue. */
async function share(
  locale: AppLocale,
  url: string,
  title: string,
  description: string,
  type: "article" | "website",
) {
  const t = await getTranslations({ locale, namespace: "brand" });
  const image = {
    url: `/${locale}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: t("name"),
  };
  return {
    openGraph: {
      type,
      url,
      siteName: t("name"),
      title,
      description,
      locale: OG_LOCALES[locale],
      images: [image],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [image],
    },
  };
}

/**
 * Article : titre exact (sans le nom du site, pour tenir dans les 60 caractères de Google),
 * description, adresse canonique. Les articles n'existent que dans leur langue : pas de hreflang.
 */
export async function guideMetadata(
  locale: AppLocale,
  guide: Guide,
): Promise<Metadata> {
  const canonical = getPathname({
    locale,
    href: { pathname: "/conseils/[slug]", params: { slug: guide.slug } },
  });
  return {
    title: { absolute: guide.metaTitle },
    description: guide.description,
    alternates: { canonical },
    ...(await share(
      locale,
      canonical,
      guide.metaTitle,
      guide.description,
      "article",
    )),
  };
}

/** Sommaire de la rubrique : versions dans les seules langues qui ont des articles. */
export async function guidesIndexMetadata(
  locale: AppLocale,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "guides" });
  const canonical = getPathname({ locale, href: "/conseils" });
  const languages = Object.fromEntries(
    GUIDE_LOCALES.map((language) => [
      language,
      getPathname({ locale: language, href: "/conseils" }),
    ]),
  );
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical, languages },
    ...(await share(
      locale,
      canonical,
      t("metaTitle"),
      t("metaDescription"),
      "website",
    )),
  };
}
