// Rubrique « Conseils » (ADR-052, docs/acquisition.md §4.2) : articles utiles, trouvés sur Google,
// qui mènent à la création du CV ou de la lettre.

export type GuideCategory = "letter" | "cv" | "country";

export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  /** Exemple complet (lettre, rubrique de CV), à copier puis adapter. */
  | { type: "example"; title: string; text: string }
  | { type: "tip"; text: string };

export type Guide = {
  /** Adresse de l'article, en minuscules et tirets (« lettre-motivation-stage-3e »). */
  slug: string;
  category: GuideCategory;
  /** Titre affiché dans l'onglet et sur Google : 60 caractères au plus. */
  metaTitle: string;
  /** Description sur Google : 155 caractères au plus. */
  description: string;
  h1: string;
  /** Chapeau sous le titre. */
  intro: string;
  /** Dernière mise à jour, au format AAAA-MM-JJ. */
  updated: string;
  sections: { heading: string; blocks: GuideBlock[] }[];
  faq: { question: string; answer: string }[];
  /** Articles liés (adresses dans la même langue). */
  related: string[];
  /** Ce que l'article propose de faire ensuite. */
  cta: "letter" | "cv";
};
