import { type AppLocale, routing } from "@/i18n/routing";
import { FR_GUIDES } from "./content/fr";
import type { Guide, GuideCategory } from "./types";

// Articles par langue : la France d'abord, les autres langues selon les résultats de Search
// Console (ADR-052). Une langue sans article n'a pas de rubrique « Conseils ».
const GUIDES: Record<AppLocale, readonly Guide[]> = {
  fr: FR_GUIDES,
  en: [],
  it: [],
  es: [],
  de: [],
};

export const GUIDE_CATEGORIES: readonly GuideCategory[] = [
  "letter",
  "cv",
  "country",
];

/** Langues qui ont une rubrique « Conseils ». */
export const GUIDE_LOCALES: readonly AppLocale[] = routing.locales.filter(
  (locale) => GUIDES[locale].length > 0,
);

export function guidesFor(locale: AppLocale) {
  return GUIDES[locale];
}

export function guideBySlug(locale: AppLocale, slug: string) {
  return GUIDES[locale].find((guide) => guide.slug === slug) ?? null;
}

/** Toutes les adresses d'articles, toutes langues confondues (pages générées à la compilation). */
export function allGuideSlugs() {
  return [
    ...new Set(
      Object.values(GUIDES).flatMap((list) => list.map((g) => g.slug)),
    ),
  ];
}

/** Ancre d'un intertitre (« Les erreurs à éviter » → « les-erreurs-a-eviter »). */
export function headingId(heading: string) {
  return heading
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
