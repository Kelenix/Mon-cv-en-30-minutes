import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getPathname } from "./navigation";
import { type AppLocale, type AppPathname, routing } from "./routing";

/** Pages sans paramètre (les pages publiques référencées). */
export type StaticPathname = Exclude<AppPathname, `${string}[${string}`>;

/** Langue au format Open Graph (langue_PAYS). */
const OG_LOCALES: Record<AppLocale, string> = {
  fr: "fr_FR",
  en: "en_GB",
  it: "it_IT",
  es: "es_ES",
  de: "de_DE",
};

type PageMetadataInput = {
  pathname: StaticPathname;
  /** Titre de la page ; absent pour l'accueil, qui garde le titre complet du site. */
  title?: string;
  description: string;
  /** false : page à ne pas indexer (création d'un CV, US-39 c.2). */
  index?: boolean;
};

/** Adresse d'une page dans chaque langue, et la version par défaut (`x-default`). */
export function pageLanguages(pathname: StaticPathname) {
  return {
    ...Object.fromEntries(
      routing.locales.map((language) => [
        language,
        getPathname({ locale: language, href: pathname }),
      ]),
    ),
    "x-default": getPathname({
      locale: routing.defaultLocale,
      href: pathname,
    }),
  };
}

/**
 * Titre, description, adresse canonique, versions dans les autres langues (hreflang) et aperçu
 * de partage (Open Graph, carte large) ; l'image de partage vient de `opengraph-image.tsx`.
 */
export async function pageMetadata({
  pathname,
  title,
  description,
  index = true,
}: PageMetadataInput): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations();
  const canonical = getPathname({ locale, href: pathname });
  const fullTitle = title
    ? `${title} · ${t("brand.name")}`
    : t("metadata.title");
  // Image de partage de la langue (src/app/[locale]/opengraph-image.tsx) : déclarée ici, car ce
  // bloc Open Graph remplace celui hérité de la mise en page.
  const image = {
    url: `/${locale}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: t("brand.name"),
  };

  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical, languages: pageLanguages(pathname) },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: t("brand.name"),
      title: fullTitle,
      description,
      locale: OG_LOCALES[locale],
      alternateLocale: routing.locales
        .filter((language) => language !== locale)
        .map((language) => OG_LOCALES[language]),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
    ...(index ? {} : { robots: { index: false } }),
  };
}
