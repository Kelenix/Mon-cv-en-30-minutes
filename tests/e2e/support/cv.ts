import { expect, type Page } from "@playwright/test";

// Préparation d'un CV dans les tests : brouillon des 5 questions puis génération (IA simulée).

export const CV_URL = /\/fr\/cv\/[0-9a-f-]{36}$/;

export const ANSWERS = {
  job: "Comptable",
  experiences: "Comptable chez Fidal\nAssistante comptable chez KPMG",
  skills: "Excel, SAP, Sage",
  education: "BTS Comptabilité et gestion, 2018",
  goal: "Devenir responsable comptable dans une PME.",
};

/** Brouillon prêt à générer, comme laissé par l'assistant (page déjà ouverte sur le site). */
export async function saveDraft(
  page: Page,
  answers: Partial<typeof ANSWERS> = {},
  language?: string,
) {
  const draft = JSON.stringify({
    answers: { ...ANSWERS, ...answers },
    step: 4,
    language,
  });
  await page.evaluate(
    (value) => localStorage.setItem("mon-cv-30s:brouillon", value),
    draft,
  );
}

/** Lance la génération et attend l'aperçu ; renvoie l'identifiant du CV. */
export async function generate(page: Page) {
  await page.goto("/fr/creer/generation");
  await expect(page).toHaveURL(CV_URL, { timeout: 20_000 });
  return page.url().split("/").at(-1)!;
}
