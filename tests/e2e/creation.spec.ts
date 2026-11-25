import { expect, type Page, test } from "@playwright/test";
import {
  expectNoAccessibilityViolations,
  MESSAGES,
  signInWithCode,
  signUp,
  uniqueEmail,
} from "./support/accounts";
import { grantPurchasedCredits } from "./support/admin";
import { ANSWERS, CV_URL, generate, saveDraft } from "./support/cv";

// Création du CV (Inc-4) : US-10 à US-15 et US-42, avec l'IA simulée (aucune clé d'API en test).
// Supabase local doit tourner (Docker).

const { fr } = MESSAGES;
const t = fr.wizard.questions;
function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(values[key]),
  );
}

function balance(page: Page, count: number) {
  const label = count === 1 || count === 0 ? "crédit" : "crédits";
  return page
    .getByRole("banner")
    .getByRole("button", { name: `${count} ${label}, voir le détail` });
}

test("un visiteur répond aux 5 questions, se connecte et obtient son CV", async ({
  page,
  context,
  isMobile,
}) => {
  // Parcours complet (saisie, connexion, génération, modifications) : plus long que la moyenne.
  test.slow();
  await page.goto("/fr/creer");
  await expect(page.getByText("Question 1 sur 5")).toBeVisible();
  await expect(
    page.getByRole("button", { name: fr.wizard.next }),
  ).toBeDisabled();
  // Aucune offre payante pendant la saisie (US-10 c.5).
  await expect(
    page.getByRole("main").getByRole("link", { name: /offres|tarifs/i }),
  ).toHaveCount(0);

  await page.getByLabel(t.job.title).fill(ANSWERS.job);
  await expect(page.getByText("9 / 2 000")).toBeVisible();
  // Le brouillon survit au rechargement (US-10 c.4).
  await page.reload();
  await expect(page.getByLabel(t.job.title)).toHaveValue(ANSWERS.job);
  await expectNoAccessibilityViolations(page);

  for (const key of ["experiences", "skills", "education", "goal"] as const) {
    await page.getByRole("button", { name: fr.wizard.next }).click();
    await page.getByLabel(t[key].title).fill(ANSWERS[key]);
  }
  await expect(page.getByText("Question 5 sur 5")).toBeVisible();
  await expect(page.getByLabel(fr.wizard.languageLabel)).toHaveValue("fr");
  await page.getByRole("button", { name: fr.wizard.previous }).click();
  await expect(page.getByLabel(t.education.title)).toHaveValue(
    ANSWERS.education,
  );
  await page.getByRole("button", { name: fr.wizard.next }).click();
  await page.getByRole("button", { name: fr.wizard.generate }).click();

  // Connexion au milieu du parcours : les réponses sont conservées.
  await expect(page).toHaveURL(/\/fr\/connexion\?next=/);
  await expect(page.getByText(fr.auth.answersKept)).toBeVisible();
  await signInWithCode(page, uniqueEmail());
  await page.getByLabel(fr.profile.firstName, { exact: true }).fill("Awa");
  await page.getByLabel(fr.profile.lastName, { exact: true }).fill("Diallo");
  await page.getByRole("button", { name: fr.welcome.continue }).click();

  await expect(page).toHaveURL(/\/fr\/creer\/generation$/);
  await expect(
    page
      .getByRole("listitem")
      .filter({ hasText: fr.generation.steps.analysis }),
  ).toBeVisible();
  await expect(page).toHaveURL(CV_URL, { timeout: 20_000 });

  // Aperçu complet (US-12) : en-tête du compte, rubriques standard.
  const sheet = page.getByRole("article", { name: fr.cvEditor.sheetLabel });
  await expect(sheet.getByText("Awa Diallo")).toBeVisible();
  for (const title of ["Profil", "Expérience professionnelle", "Compétences"]) {
    await expect(sheet.getByRole("heading", { name: title })).toBeVisible();
  }
  await expect(sheet.getByText("Assistante comptable chez KPMG")).toBeVisible();
  // Première génération gratuite (US-11 c.1).
  await expect(balance(page, 0)).toBeVisible();
  await expectNoAccessibilityViolations(page);

  // Copie du texte (US-13).
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: fr.cvEditor.copy }).click();
  await expect(
    page.getByRole("button", { name: fr.cvEditor.copied }),
  ).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  // Le presse-papiers de Windows convertit les fins de ligne.
  const lines = copied.replaceAll("\r\n", "\n");
  expect(lines).toContain("Awa Diallo\nComptable");
  expect(lines).toContain("EXPÉRIENCE PROFESSIONNELLE\nComptable chez Fidal");

  // Modification sur place, enregistrée automatiquement (US-14).
  await page
    .getByRole("button", {
      name: fill(fr.cvEditor.edit, { section: "Profil" }),
    })
    .click();
  await page
    .getByLabel(fr.cvEditor.fields.summary)
    .fill("Comptable rigoureuse, 5 ans d'expérience en cabinet.");
  await expect(
    page.getByText(fr.cvEditor.status.saved, { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: fill(fr.cvEditor.done, { section: "Profil" }),
    })
    .click();
  await page
    .getByRole("button", {
      name: fill(fr.cvEditor.edit, { section: "Langues" }),
    })
    .click();
  await page.getByRole("button", { name: fr.cvEditor.addLanguage }).click();
  await page
    .getByLabel(fr.cvEditor.fields.language, { exact: true })
    .fill("Anglais");
  await page
    .getByLabel(fr.cvEditor.fields.level, { exact: true })
    .fill("courant");
  await expect(
    page.getByText(fr.cvEditor.status.saved, { exact: true }),
  ).toBeVisible();

  await page.reload();
  await expect(
    sheet.getByText("Comptable rigoureuse, 5 ans d'expérience en cabinet."),
  ).toBeVisible();
  await expect(sheet.getByText("Anglais (courant)")).toBeVisible();

  // Encart des offres après la génération, refermable (US-15).
  const upsell = page.getByRole("complementary", { name: fr.upsell.title });
  await expect(upsell.getByRole("link", { name: fr.upsell.cta })).toBeVisible();
  await upsell.getByRole("button", { name: fr.upsell.close }).click();
  await expect(upsell).toBeHidden();
  await page.reload();
  await expect(sheet.getByText("Awa Diallo")).toBeVisible();
  await expect(upsell).toBeHidden();

  // Le brouillon est effacé une fois le CV enregistré ; le CV figure dans « Mes CV ».
  await page.goto("/fr/creer");
  await expect(page.getByLabel(t.job.title)).toHaveValue("");
  const banner = page.getByRole("banner");
  if (isMobile) {
    await banner.getByRole("button", { name: fr.nav.menu }).click();
    await page.getByRole("menuitem", { name: fr.nav.myCvs }).click();
  } else {
    await banner.getByRole("link", { name: fr.nav.myCvs }).click();
  }
  await expect(page.getByRole("link", { name: /Comptable/ })).toBeVisible();
});

test("sans crédit, il faut remplacer le CV puis recharger ; le crédit est débité au succès", async ({
  page,
}) => {
  const email = await signUp(page);
  await saveDraft(page);
  await generate(page);
  const firstCv = page.url();

  // Sans abonnement, un seul CV est conservé (H22) : choix du CV remplacé.
  await saveDraft(page, { job: "Contrôleuse de gestion" });
  await page.goto("/fr/creer/generation");
  const replace = page.getByRole("alertdialog", {
    name: fr.generation.replace.title,
  });
  await expect(replace.getByRole("radio", { name: /Comptable/ })).toBeChecked();
  await expectNoAccessibilityViolations(page);
  await replace
    .getByRole("button", { name: fr.generation.replace.confirm })
    .click();

  // Gratuité déjà utilisée et solde nul : fenêtre « Solde insuffisant » (US-08).
  const credits = page.getByRole("alertdialog", {
    name: "Il te manque 1 crédit",
  });
  await expect(
    credits.getByText("Générer un CV coûte 1 crédit. Ton solde : 0 crédit."),
  ).toBeVisible();
  // Recharge proposée sur place (US-18), retour sur la génération après paiement.
  await expect(
    credits.getByRole("button", { name: /^15 crédits \(6,99/ }),
  ).toBeVisible();
  await credits.getByRole("button", { name: fr.generation.cancel }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    fr.errors.INSUFFICIENT_CREDITS,
  );

  await grantPurchasedCredits(email, 2);
  await page.getByRole("button", { name: fr.generation.retry }).click();
  await expect(page).toHaveURL(CV_URL, { timeout: 20_000 });
  expect(page.url()).not.toBe(firstCv);
  await expect(balance(page, 1)).toBeVisible();

  await page.goto(firstCv);
  await expect(
    page.getByRole("heading", { name: fr.cvEditor.notFound }),
  ).toBeVisible();
  await page.goto("/fr/cv");
  await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: /Contrôleuse de gestion/ }),
  ).toBeVisible();
});

test("si l'IA échoue, un message clair propose de réessayer sans rien perdre (US-11 c.6)", async ({
  page,
}) => {
  await signUp(page);
  await saveDraft(page, { job: "[simulation:echec] Comptable" });
  await page.goto("/fr/creer/generation");

  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    fr.errors.AI_UNAVAILABLE,
  );
  await expect(
    page.getByRole("button", { name: fr.generation.retry }),
  ).toBeVisible();
  await page.getByRole("link", { name: fr.generation.editAnswers }).click();

  // Réponses conservées ; la gratuité n'a pas été consommée.
  await expect(page.getByLabel(fr.wizard.languageLabel)).toBeVisible();
  await page.getByRole("button", { name: fr.wizard.previous }).click();
  await page.getByRole("button", { name: fr.wizard.previous }).click();
  await page.getByRole("button", { name: fr.wizard.previous }).click();
  await page.getByRole("button", { name: fr.wizard.previous }).click();
  await expect(page.getByLabel(t.job.title)).toHaveValue(
    "[simulation:echec] Comptable",
  );
  await page.getByLabel(t.job.title).fill("Comptable");
  await saveDraft(page);
  await generate(page);
  await expect(balance(page, 0)).toBeVisible();
});

test("le CV est rédigé dans la langue choisie et reste lisible sur mobile (US-42, US-12 c.3)", async ({
  page,
}) => {
  await signUp(page);
  await saveDraft(page, {}, "en");
  await generate(page);

  // Intitulés dans la langue du CV, interface en français.
  const sheet = page.locator("article[lang='en']");
  for (const title of ["Profile", "Professional Experience", "Education"]) {
    await expect(sheet.getByRole("heading", { name: title })).toBeVisible();
  }
  await expect(
    page.getByRole("button", { name: fr.cvEditor.copy }),
  ).toBeVisible();

  // 360 px : la plus petite largeur courante (Android). Mesure par élément : en émulation
  // mobile, la largeur de la page s'agrandit au lieu de défiler.
  await page.setViewportSize({ width: 360, height: 800 });
  await expect(sheet.getByText("Awa Diallo")).toBeVisible();
  const overflowing = await page.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .filter((element) => {
        if (element.getBoundingClientRect().right <= 361) return false;
        // Dans une zone qui défile horizontalement (onglets), seule la zone compte.
        for (let box = element.parentElement; box; box = box.parentElement) {
          if (["auto", "scroll"].includes(getComputedStyle(box).overflowX)) {
            return box.getBoundingClientRect().right > 361;
          }
        }
        return true;
      })
      .map((element) => element.tagName),
  );
  expect(overflowing).toEqual([]);
});

test("le CV d'un autre compte est introuvable", async ({ page, context }) => {
  await signUp(page);
  await saveDraft(page);
  await generate(page);
  const otherCv = page.url();

  await context.clearCookies();
  await signUp(page);
  await page.goto(otherCv);
  await expect(
    page.getByRole("heading", { name: fr.cvEditor.notFound }),
  ).toBeVisible();
  await expect(page.getByText("Awa Diallo")).toHaveCount(0);
});

test("sans brouillon, la génération invite à répondre aux questions", async ({
  page,
}) => {
  await signUp(page);
  await page.goto("/fr/creer/generation");
  await expect(page.getByText(fr.generation.noDraft)).toBeVisible();
  await page.getByRole("link", { name: fr.generation.answerQuestions }).click();
  await expect(page).toHaveURL(/\/fr\/creer$/);
});
