import { expect, type Page, test } from "@playwright/test";
import {
  expectNoAccessibilityViolations,
  MESSAGES,
  signUp,
} from "./support/accounts";
import { activateSubscription, grantPurchasedCredits } from "./support/admin";
import { generate, saveDraft } from "./support/cv";

// Outils d'amélioration par l'IA (Inc-7) : US-25, US-26, US-27, US-09, avec l'IA simulée.
// Supabase local doit tourner (Docker).

const { fr } = MESSAGES;
const POSTING =
  "Nous recherchons un comptable confirmé pour notre cabinet : consolidation IFRS, fiscalité des entreprises, maîtrise de SAP et d'Excel.";

function balance(page: Page, count: number) {
  const label = count === 1 || count === 0 ? "crédit" : "crédits";
  return page
    .getByRole("banner")
    .getByRole("button", { name: `${count} ${label}, voir le détail` });
}

/** Ajoute une mission à la première expérience, puis attend l'enregistrement. */
async function addMission(page: Page, text: string) {
  await page
    .getByRole("button", { name: "Modifier : Expérience professionnelle" })
    .click();
  await page
    .getByRole("button", { name: fr.cvEditor.addBullet })
    .first()
    .click();
  await page.getByLabel("Point 1").first().fill(text);
  await expect(
    page.getByText(fr.cvEditor.status.saved, { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Terminer la modification : Expérience professionnelle",
    })
    .click();
}

test("améliorer une expérience puis l'accroche, crédit débité à chaque fois (US-25, US-26)", async ({
  page,
}) => {
  test.slow();
  const email = await signUp(page);
  await saveDraft(page);
  await generate(page);
  await grantPurchasedCredits(email, 3);
  await page.reload();
  await addMission(page, "gestion de la paie");

  // Avant / après, puis Remplacer.
  await page
    .getByRole("button", { name: "Améliorer avec l'IA — 1 crédit" })
    .first()
    .click();
  const compare = page.getByRole("alertdialog", {
    name: fr.cvTools.experience.title,
  });
  await expect(
    compare.getByText("gestion de la paie", { exact: true }),
  ).toBeVisible();
  await expect(
    compare.getByText("Gestion de la paie", { exact: true }),
  ).toBeVisible();
  await expectNoAccessibilityViolations(page);
  await compare
    .getByRole("button", { name: fr.cvTools.experience.replace })
    .click();
  const sheet = page.getByRole("article", { name: fr.cvEditor.sheetLabel });
  await expect(
    sheet.getByText("Gestion de la paie", { exact: true }),
  ).toBeVisible();
  await expect(balance(page, 2)).toBeVisible();

  // 3 variantes sans abonnement ; la variante choisie remplace l'accroche.
  await expect(
    page.getByText(fr.cvEditor.status.saved, { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Améliorer l'accroche — 1 crédit" })
    .click();
  const variants = page.getByRole("alertdialog", {
    name: fr.cvTools.summary.title,
  });
  await expect(variants.getByRole("radio")).toHaveCount(3);
  await variants.getByRole("radio").nth(1).check();
  await variants
    .getByRole("button", { name: fr.cvTools.summary.choose })
    .click();
  await expect(sheet.getByText(/\(2\/3\)$/)).toBeVisible();
  await expect(balance(page, 1)).toBeVisible();

  // Les propositions restent consultables avec le CV (H20).
  await expect(
    page.getByText(fr.cvEditor.status.saved, { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Propositions (1)" }).click();
  await expect(
    page
      .getByRole("alertdialog", { name: fr.cvTools.summary.title })
      .getByRole("radio"),
  ).toHaveCount(3);
});

test("sans crédit, la fenêtre « Solde insuffisant » propose de recharger (US-08)", async ({
  page,
}) => {
  await signUp(page);
  await saveDraft(page);
  await generate(page);

  await page
    .getByRole("button", { name: "Améliorer l'accroche — 1 crédit" })
    .click();
  const dialog = page.getByRole("alertdialog", {
    name: "Il te manque 1 crédit",
  });
  await expect(
    dialog.getByText("Améliorer l'accroche coûte 1 crédit."),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: /^15 crédits — 6,99/ }),
  ).toBeVisible();
});

test("adapter à une offre : mots-clés manquants, nouveau CV en Pro (US-27)", async ({
  page,
}) => {
  test.slow();
  const email = await signUp(page);
  await saveDraft(page);
  const cvId = await generate(page);
  await activateSubscription(email, "pro");

  await page.getByRole("link", { name: fr.cvTools.tabs.adapt }).click();
  await expect(page).toHaveURL(new RegExp(`/fr/cv/${cvId}/adapter$`), {
    timeout: 20_000,
  });

  // Annonce trop courte : refusée sans débit.
  const posting = page.getByLabel(fr.cvTools.adapt.postingLabel);
  await posting.fill("Comptable");
  await page.getByRole("button", { name: "Adapter — 2 crédits" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    fr.errors.fields.tooShort,
  );

  await posting.fill(POSTING);
  await expect(page.getByLabel(fr.cvTools.adapt.languageLabel)).toHaveValue(
    "fr",
  );
  await page.getByRole("button", { name: "Adapter — 2 crédits" }).click();
  const result = page.getByRole("region", {
    name: fr.cvTools.adapt.resultTitle,
  });
  await expect(
    result.getByRole("heading", { name: fr.cvTools.adapt.missingTitle }),
  ).toBeVisible();
  await expect(
    result.getByRole("listitem").filter({ hasText: "consolidation" }),
  ).toBeVisible();
  await expect(balance(page, 58)).toBeVisible();
  await expectNoAccessibilityViolations(page);

  await result
    .getByRole("button", { name: fr.cvTools.adapt.saveAsNew })
    .click();
  await expect(page).toHaveURL(/\/fr\/cv\/[0-9a-f-]{36}$/);
  expect(page.url()).not.toContain(cvId);
  await page.goto("/fr/cv");
  await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(2);
  await expect(
    page.getByRole("link", { name: /Comptable — adapté/ }),
  ).toBeVisible();
});

test("Essential : l'adaptation se paie en crédits achetés (US-09 c.2)", async ({
  page,
}) => {
  const email = await signUp(page);
  await saveDraft(page);
  await generate(page);
  await activateSubscription(email, "essential");

  await page.getByRole("link", { name: fr.cvTools.tabs.adapt }).click();
  await page.getByLabel(fr.cvTools.adapt.postingLabel).fill(POSTING);
  await page.getByRole("button", { name: "Adapter — 2 crédits" }).click();
  const dialog = page.getByRole("alertdialog", {
    name: "Il te manque 2 crédits",
  });
  await expect(dialog.getByText(fr.creditsDialog.purchasedOnly)).toBeVisible();
});
