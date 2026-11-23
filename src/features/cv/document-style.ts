import type { CvSectionTitles } from "./content";

// Constantes de mise en page du CV, communes à l'aperçu (variables `--cv-*` de globals.css), au
// PDF et au DOCX (docs/architecture.md §10, R09) : une colonne, couleurs sobres (H34).

export const CV_COLORS = {
  text: "#171717",
  accent: "#1f3b63",
  muted: "#4b5563",
} as const;

/** Police standard : Arial dans l'aperçu et le DOCX, Arimo (mêmes dimensions) dans le PDF. */
export const CV_FONT = "Arial";

/** Textes d'un document exporté, dans la langue du CV (US-42 c.3). */
export type CvDocumentTexts = {
  titles: CvSectionTitles;
  /** Mention « Créé avec … » en pied de page ; absente pour un export sans filigrane. */
  watermark?: string;
  /** Langue du CV (code BCP 47), pour les lecteurs d'écran et les logiciels de recrutement. */
  language: string;
};
