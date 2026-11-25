import { z } from "zod";

// Modèles de mise en page du CV (Inc-15, ADR-050). Logique pure, partagée par le serveur (export,
// actions) et l'interface (galerie, cadenas). L'ordre est celui de la galerie.

export const CV_TEMPLATES = [
  "ats-classique",
  "europeen",
  "ats-moderne",
  "lebenslauf",
  "moderne",
  "elegant",
] as const;
export type CvTemplate = (typeof CV_TEMPLATES)[number];

export const DEFAULT_TEMPLATE: CvTemplate = "ats-classique";
export const cvTemplateSchema = z.enum(CV_TEMPLATES);

export type TemplateInfo = {
  /** Téléchargement pour tous ; sinon formule ou CV Pro (choix de l'utilisateur). */
  free: boolean;
  /** Une colonne, intitulés standard : lu sans perte par les logiciels de recrutement (H34). */
  ats: boolean;
  /** Emplacement prévu pour une photo (facultative). */
  photo: boolean;
};

export const TEMPLATE_INFO: Record<CvTemplate, TemplateInfo> = {
  "ats-classique": { free: true, ats: true, photo: false },
  europeen: { free: true, ats: false, photo: true },
  "ats-moderne": { free: false, ats: true, photo: false },
  lebenslauf: { free: false, ats: false, photo: true },
  moderne: { free: false, ats: false, photo: true },
  elegant: { free: false, ats: true, photo: false },
};

/** Photo du CV : JPEG au format portrait (4:5), au plus 300 Ko (contrainte de la table). */
export const CV_PHOTO = { width: 480, height: 600, maxBytes: 300 * 1024 };

/** Lecture tolérante d'une valeur de la base : un modèle inconnu redevient le modèle par défaut. */
export function toTemplate(value: string | null | undefined): CvTemplate {
  const parsed = cvTemplateSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_TEMPLATE;
}

/** Téléchargement du modèle : gratuit, ou droits d'export complets (abonnement ou CV Pro). */
export function canDownloadTemplate(
  template: CvTemplate,
  exportUnlocked: boolean,
) {
  return TEMPLATE_INFO[template].free || exportUnlocked;
}
