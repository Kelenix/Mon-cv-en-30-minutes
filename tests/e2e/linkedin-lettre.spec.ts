import { expect, type Page, test } from "@playwright/test";
import {
  expectNoAccessibilityViolations,
  MESSAGES,
  signUp,
} from "./support/accounts";
import { activateSubscription, grantPurchasedCredits } from "./support/admin";
import { generate, saveDraft } from "./support/cv";

// Version LinkedIn et lettre de motivation (Inc-8) : US-28, US-29, H20, H21, avec l'IA simulée.
// Supabase local doit tourner (Docker).

const { fr } = MESSAGES;

function balance(page: Page, count: number) {
  const label = count === 1 || count === 0 ? "crédit" : "crédits";
  return page
    .getByRole("banner")
    .getByRole("button", { name: `${count} ${label}, voir le détail` });
}

/** Texte du presse-papiers (Windows convertit les fins de ligne). */
async function clipboard(page: Page) {
  const text = await page.evaluate(() => navigator.clipboard.readText());
  return text.replaceAll("\r\n", "\n");
}

test("version LinkedIn : générée, modifiée, conservée et copiable (US-28)", async ({
  page,
  context,
}) => {
  test.slow();
  const email = await signUp(page);
  await saveDraft(page);
  const cvId = await generate(page);
  await grantPurchasedCredits(email, 1);
  await page.reload();

  await page.getByRole("link", { name: fr.cvTools.tabs.linkedin }).click();
  await expect(page).toHaveURL(new RegExp(`/fr/cv/${cvId}/linkedin$`), {
    timeout: 20_000,
  });
  await page
    .getByRole("button", { name: "Générer ma version LinkedIn (1 crédit)" })
    .click();

  const result = page.getByRole("region", {
    name: fr.cvTools.linkedin.resultTitle,
  });
  const headline = result.getByLabel(fr.cvTools.linkedin.headline, {
    exact: true,
  });
  await expect(headline).toHaveValue(/^Comptable/);
  await expect(
    result.getByLabel(fr.cvTools.linkedin.about, { exact: true }),
  ).not.toBeEmpty();
  // Une description par expérience du CV, sous son intitulé.
  await expect(
    result.getByLabel("Assistante comptable chez KPMG", { exact: true }),
  ).toBeVisible();
  await expect(balance(page, 0)).toBeVisible();
  await expectNoAccessibilityViolations(page);

  // Modification enregistrée automatiquement et retrouvée avec le CV (H20, H21).
  await headline.fill("Comptable | Paie et fiscalité");
  await expect(
    result.getByText(fr.cvEditor.status.saved, { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByLabel(fr.cvTools.linkedin.headline, { exact: true }),
  ).toHaveValue("Comptable | Paie et fiscalité");
  await expect(
    page.getByRole("button", {
      name: "Générer une nouvelle version (1 crédit)",
    }),
  ).toBeVisible();

  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page
    .getByRole("button", { name: fr.cvTools.linkedin.copyHeadline })
    .click();
  await expect(
    page.getByRole("button", { name: fr.cvEditor.copied }),
  ).toBeVisible();
  expect(await clipboard(page)).toBe("Comptable | Paie et fiscalité");

  // Une limite de LinkedIn dépassée n'est pas enregistrée.
  await page
    .getByLabel(fr.cvTools.linkedin.about, { exact: true })
    .evaluate((element: HTMLTextAreaElement) => {
      element.removeAttribute("maxlength");
    });
  await page
    .getByLabel(fr.cvTools.linkedin.about, { exact: true })
    .fill("a".repeat(2_601));
  await expect(
    page.getByText(fr.cvEditor.status.invalid, { exact: true }),
  ).toBeVisible();
});

test("lettre de motivation : poste obligatoire, lettre modifiable, versions conservées (US-29)", async ({
  page,
  context,
}) => {
  test.slow();
  const email = await signUp(page);
  await saveDraft(page);
  const cvId = await generate(page);
  await activateSubscription(email, "pro");

  await page.getByRole("link", { name: fr.cvTools.tabs.letter }).click();
  await expect(page).toHaveURL(new RegExp(`/fr/cv/${cvId}/lettre$`), {
    timeout: 20_000,
  });
  const submit = page.getByRole("button", {
    name: "Rédiger ma lettre (2 crédits)",
  });

  // Poste vide (des espaces) : refusé par le serveur, sans débit.
  await page.getByLabel(fr.cvTools.letter.position).fill("  ");
  await submit.click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    fr.errors.fields.required,
  );

  await page
    .getByLabel(fr.cvTools.letter.position)
    .fill("Responsable comptable");
  await page.getByLabel(fr.cvTools.letter.company).fill("Cabinet Martin");
  await submit.click();
  const result = page.getByRole("region", {
    name: fr.cvTools.letter.resultTitle,
  });
  const letter = result.getByLabel(fr.cvTools.letter.letter, { exact: true });
  await expect(letter).toHaveValue(/^Responsable comptable, Cabinet Martin/);
  await expect(letter).toHaveValue(/Awa Diallo$/);
  await expect(result.getByText(/^\d+ mots$/)).toBeVisible();
  await expect(balance(page, 58)).toBeVisible();
  await expectNoAccessibilityViolations(page);

  // Correction enregistrée, puis copie.
  await letter.fill("Madame, Monsieur,\n\nJe vous propose ma candidature.");
  await expect(
    result.getByText(fr.cvEditor.status.saved, { exact: true }),
  ).toBeVisible();
  await expect(result.getByText("7 mots", { exact: true })).toBeVisible();
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await result.getByRole("button", { name: fr.cvTools.letter.copy }).click();
  expect(await clipboard(page)).toBe(
    "Madame, Monsieur,\n\nJe vous propose ma candidature.",
  );

  // Deuxième lettre : la première reste consultable avec ses corrections (H20).
  await page
    .getByLabel(fr.cvTools.letter.position)
    .fill("Contrôleur de gestion");
  await page.getByLabel(fr.cvTools.letter.company).fill("");
  await submit.click();
  await expect(letter).toHaveValue(/^Contrôleur de gestion/);
  await page.reload();
  const versions = page.getByRole("region", {
    name: fr.cvTools.generated.historyTitle,
  });
  await expect(versions.getByRole("listitem")).toHaveCount(2);
  // Les intitulés longs passent à la ligne : aucun défilement horizontal sur mobile.
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await versions
    .getByRole("listitem")
    .filter({ hasText: "Responsable comptable, Cabinet Martin" })
    .getByRole("button", { name: fr.cvTools.generated.show })
    .click();
  await expect(
    page.getByLabel(fr.cvTools.letter.letter, { exact: true }),
  ).toHaveValue("Madame, Monsieur,\n\nJe vous propose ma candidature.");
});

test("Essential : la lettre se paie en crédits achetés (US-09 c.2)", async ({
  page,
}) => {
  const email = await signUp(page);
  await saveDraft(page);
  await generate(page);
  await activateSubscription(email, "essential");

  await page.getByRole("link", { name: fr.cvTools.tabs.letter }).click();
  await page.getByLabel(fr.cvTools.letter.position).fill("Comptable");
  await page
    .getByRole("button", { name: "Rédiger ma lettre (2 crédits)" })
    .click();
  const dialog = page.getByRole("alertdialog", {
    name: "Il te manque 2 crédits",
  });
  await expect(dialog.getByText(fr.creditsDialog.purchasedOnly)).toBeVisible();
});
