import { expect, type Page, test } from "@playwright/test";
import {
  expectNoAccessibilityViolations,
  MESSAGES,
  signUp,
} from "./support/accounts";
import { activateSubscription } from "./support/admin";
import { generate, saveDraft } from "./support/cv";

// Simulation d'entretien (Inc-9) : US-30, avec l'IA simulée. Supabase local doit tourner.

const { fr } = MESSAGES;
const t = fr.cvTools.interview;

function balance(page: Page, count: number) {
  const label = count === 1 || count === 0 ? "crédit" : "crédits";
  return page
    .getByRole("banner")
    .getByRole("button", { name: `${count} ${label}, voir le détail` });
}

/** CV généré, abonnement actif, onglet « Entretien » ouvert ; renvoie l'identifiant du CV. */
async function openInterview(page: Page, plan: "pro" | "essential") {
  const email = await signUp(page);
  await saveDraft(page);
  const cvId = await generate(page);
  await activateSubscription(email, plan);
  await page.getByRole("link", { name: fr.cvTools.tabs.interview }).click();
  await expect(page).toHaveURL(new RegExp(`/fr/cv/${cvId}/entretien$`), {
    timeout: 20_000,
  });
  return cvId;
}

/** Lance une simulation pour le poste donné et renvoie la zone des questions. */
async function startSimulation(page: Page, position: string) {
  await page.getByLabel(t.position, { exact: true }).fill(position);
  await page
    .getByRole("button", { name: "Lancer la simulation — 2 crédits" })
    .click();
  const simulation = page.getByRole("region", {
    name: new RegExp(`^Entretien.+${position}$`),
  });
  await expect(simulation.getByRole("textbox")).toHaveCount(8);
  return simulation;
}

test("8 questions, réponses écrites, retour gratuit conservé avec le CV (US-30)", async ({
  page,
}) => {
  test.slow();
  await openInterview(page, "pro");

  // Poste vide (des espaces) : refusé par le serveur, sans débit.
  await page.getByLabel(t.position, { exact: true }).fill("  ");
  await page
    .getByRole("button", { name: "Lancer la simulation — 2 crédits" })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    fr.errors.fields.required,
  );

  const simulation = await startSimulation(page, "Responsable comptable");
  await expect(balance(page, 58)).toBeVisible();
  await expectNoAccessibilityViolations(page);

  // Réponse à une partie des questions seulement (c.2).
  const review = simulation.getByRole("button", { name: t.review });
  await expect(review).toBeDisabled();
  const fields = simulation.getByRole("textbox");
  await fields
    .nth(0)
    .fill("J'ai tenu la comptabilité de 40 clients chez Fidal.");
  await fields.nth(2).fill("Je suis rigoureuse et organisée.");
  await review.click();

  // Retour pour chaque question répondue, sans coût (c.3).
  await expect(simulation.getByText(t.strengths, { exact: true })).toHaveCount(
    2,
  );
  await expect(simulation.getByText(t.example, { exact: true })).toHaveCount(2);
  await expect(simulation.getByText(t.unanswered)).toHaveCount(6);
  await expect(simulation.getByRole("textbox")).toHaveCount(0);
  await expect(balance(page, 58)).toBeVisible();
  await expectNoAccessibilityViolations(page);

  // Conservée avec le CV et relisible (c.4).
  await page.reload();
  const saved = page.getByRole("region", {
    name: /^Entretien.+Responsable comptable$/,
  });
  await expect(saved.getByText(t.strengths, { exact: true })).toHaveCount(2);
  await expect(saved.getByText(t.yourAnswer, { exact: true })).toHaveCount(2);
  await expect(
    saved
      .getByText("J'ai tenu la comptabilité de 40 clients chez Fidal.", {
        exact: true,
      })
      .first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: t.review })).toHaveCount(0);
});

test("un retour qui échoue ne coûte rien et peut être redemandé (US-30 c.3)", async ({
  page,
}) => {
  await openInterview(page, "pro");
  const simulation = await startSimulation(page, "Comptable");
  const field = simulation.getByRole("textbox").first();

  await field.fill("[simulation:echec] Ma réponse");
  await simulation.getByRole("button", { name: t.review }).click();
  await expect(simulation.getByRole("alert")).toHaveText(t.reviewFailed);
  await expect(balance(page, 58)).toBeVisible();

  await field.fill("Ma réponse");
  await simulation.getByRole("button", { name: t.review }).click();
  await expect(simulation.getByText(t.strengths, { exact: true })).toHaveCount(
    1,
  );
});

test("Essential : la simulation se paie en crédits achetés (US-30 c.5)", async ({
  page,
}) => {
  await openInterview(page, "essential");
  await page.getByLabel(t.position, { exact: true }).fill("Comptable");
  await page
    .getByRole("button", { name: "Lancer la simulation — 2 crédits" })
    .click();
  const dialog = page.getByRole("alertdialog", {
    name: "Il te manque 2 crédits",
  });
  await expect(dialog.getByText(fr.creditsDialog.purchasedOnly)).toBeVisible();
});
