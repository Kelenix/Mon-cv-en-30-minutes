import { z } from "@/lib/zod";
import type { AppLocale } from "@/i18n/routing";
import { CV_TEMPLATES, type CvTemplate, TEMPLATE_INFO } from "./templates";

// Pays visés et modèles recommandés (Inc-15, ADR-050) : usages courants de présentation du CV,
// par pays ou par groupe de pays. Logique pure, partagée par le serveur et l'interface.

export const CONTINENTS = [
  "europe",
  "north-america",
  "latin-america",
  "africa",
  "middle-east",
  "asia",
  "oceania",
] as const;
export type Continent = (typeof CONTINENTS)[number];

/** Place de la photo dans les usages du pays. */
export type PhotoUsage = "common" | "optional" | "avoid";

type Usage = { templates: CvTemplate[]; photo: PhotoUsage };

// Usages partagés par plusieurs pays.
const ANGLO: Usage = {
  templates: ["ats-classique", "ats-moderne", "elegant"],
  photo: "avoid",
};
const GERMAN: Usage = {
  templates: ["lebenslauf", "ats-moderne", "europeen"],
  photo: "common",
};
const FRENCH: Usage = {
  templates: ["ats-moderne", "moderne", "elegant"],
  photo: "optional",
};
const EUROPASS: Usage = {
  templates: ["europeen", "moderne", "ats-moderne"],
  photo: "common",
};
const NORDIC: Usage = {
  templates: ["ats-moderne", "moderne", "ats-classique"],
  photo: "optional",
};
const PHOTO_MODERN: Usage = {
  templates: ["moderne", "europeen", "ats-moderne"],
  photo: "common",
};
const ATS_FIRST: Usage = {
  templates: ["ats-classique", "ats-moderne", "moderne"],
  photo: "optional",
};

const COUNTRY_TABLE = {
  FR: ["europe", FRENCH],
  BE: ["europe", FRENCH],
  LU: ["europe", FRENCH],
  CH: ["europe", GERMAN],
  DE: ["europe", GERMAN],
  AT: ["europe", GERMAN],
  IT: ["europe", EUROPASS],
  ES: ["europe", EUROPASS],
  PT: ["europe", EUROPASS],
  GR: ["europe", EUROPASS],
  PL: ["europe", EUROPASS],
  RO: ["europe", EUROPASS],
  CZ: ["europe", EUROPASS],
  GB: ["europe", ANGLO],
  IE: ["europe", ANGLO],
  NL: ["europe", NORDIC],
  SE: ["europe", NORDIC],
  NO: ["europe", NORDIC],
  DK: ["europe", NORDIC],
  FI: ["europe", NORDIC],
  US: ["north-america", ANGLO],
  CA: ["north-america", ANGLO],
  MX: ["latin-america", PHOTO_MODERN],
  BR: ["latin-america", PHOTO_MODERN],
  AR: ["latin-america", PHOTO_MODERN],
  CO: ["latin-america", PHOTO_MODERN],
  CL: ["latin-america", PHOTO_MODERN],
  MA: ["africa", PHOTO_MODERN],
  DZ: ["africa", PHOTO_MODERN],
  TN: ["africa", PHOTO_MODERN],
  SN: ["africa", PHOTO_MODERN],
  CI: ["africa", PHOTO_MODERN],
  CM: ["africa", PHOTO_MODERN],
  NG: ["africa", ATS_FIRST],
  ZA: ["africa", ATS_FIRST],
  AE: ["middle-east", PHOTO_MODERN],
  SA: ["middle-east", PHOTO_MODERN],
  QA: ["middle-east", PHOTO_MODERN],
  IN: ["asia", ATS_FIRST],
  SG: ["asia", ATS_FIRST],
  CN: ["asia", PHOTO_MODERN],
  JP: ["asia", PHOTO_MODERN],
  AU: ["oceania", ANGLO],
  NZ: ["oceania", ANGLO],
} as const satisfies Record<string, readonly [Continent, Usage]>;

export type CountryCode = keyof typeof COUNTRY_TABLE;
export const COUNTRY_CODES = Object.keys(COUNTRY_TABLE) as CountryCode[];
export const countrySchema = z.enum(COUNTRY_CODES);

export function isCountry(value: unknown): value is CountryCode {
  return countrySchema.safeParse(value).success;
}

export function continentOf(country: CountryCode): Continent {
  return COUNTRY_TABLE[country][0];
}

/** Modèles conseillés pour le pays, du plus adapté au moins adapté. */
export function recommendedTemplates(country: CountryCode): CvTemplate[] {
  return COUNTRY_TABLE[country][1].templates;
}

/** Ordre de la galerie : les modèles recommandés d'abord, puis les autres. */
export function orderedTemplates(country: CountryCode): CvTemplate[] {
  const recommended = recommendedTemplates(country);
  return [
    ...recommended,
    ...CV_TEMPLATES.filter((template) => !recommended.includes(template)),
  ];
}

export function photoUsage(country: CountryCode): PhotoUsage {
  return COUNTRY_TABLE[country][1].photo;
}

/** Pays par défaut d'une langue du site. */
const LOCALE_COUNTRY: Record<AppLocale, CountryCode> = {
  fr: "FR",
  en: "GB",
  it: "IT",
  es: "ES",
  de: "DE",
};

/**
 * Pays proposé : celui des langues du navigateur (« fr-BE » → Belgique) s'il est connu, sinon
 * celui de la langue du site. Rien n'est envoyé au serveur.
 */
export function defaultCountry(
  locale: AppLocale,
  browserLanguages: readonly string[] = [],
): CountryCode {
  for (const tag of browserLanguages) {
    const region = tag.split("-")[1]?.toUpperCase();
    if (isCountry(region)) return region;
  }
  return LOCALE_COUNTRY[locale];
}

/**
 * Modèle donné à un nouveau CV : le premier recommandé que le compte peut télécharger (un modèle
 * gratuit sans formule), sinon le modèle ATS classique.
 */
export function initialTemplate(
  country: CountryCode,
  canDownloadAll: boolean,
): CvTemplate {
  return (
    recommendedTemplates(country).find(
      (template) => canDownloadAll || TEMPLATE_INFO[template].free,
    ) ?? "ats-classique"
  );
}
