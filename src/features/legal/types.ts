export const LEGAL_PAGES = [
  "legalNotice",
  "terms",
  "privacy",
  "cookies",
] as const;
export type LegalPage = (typeof LEGAL_PAGES)[number];

/**
 * Variables insérées dans les textes légaux sous la forme `{nom}`. Les valeurs viennent des
 * variables d'environnement `LEGAL_*` (tâche manuelle 7) et du nom de marque de la langue.
 */
export const LEGAL_PLACEHOLDERS = [
  "brandName",
  "siteUrl",
  "companyName",
  "legalForm",
  "registration",
  "address",
  "email",
  "publisher",
  "vatNumber",
  "hosting",
  "mediator",
] as const;
export type LegalPlaceholder = (typeof LEGAL_PLACEHOLDERS)[number];

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type LegalDocument = {
  title: string;
  description: string;
  sections: LegalSection[];
};

export type LegalContent = {
  /** Date de dernière mise à jour, au format AAAA-MM-JJ. */
  updatedAt: string;
  pages: Record<LegalPage, LegalDocument>;
};
