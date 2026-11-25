import { expect, test } from "@playwright/test";
import {
  expectNoAccessibilityViolations,
  MESSAGES,
  signInWithCode,
  signUp,
} from "./support/accounts";
import { generate, saveDraft } from "./support/cv";

// Parrainage (ADR-052) : le lien du compte, l'invitation acceptée, puis 5 crédits pour chacun
// au premier CV du filleul. Supabase local doit tourner (Docker).

const { fr } = MESSAGES;

test("parrainage : invitation acceptée, 5 crédits chacun au premier CV", async ({
  page,
}) => {
  test.slow();
  const parrain = await signUp(page);
  const card = page.getByRole("region", {
    name: "Invite tes amis : 5 crédits chacun",
  });
  await expect(
    card.getByText("Aucun ami inscrit pour l'instant"),
  ).toBeVisible();
  const link = await card
    .getByText(/\/fr\/invitation\/[a-z0-9]{8}\?utm_source=parrainage$/)
    .textContent();
  const invitation = new URL(link!);

  await page.getByRole("button", { name: fr.account.signOut }).click();
  await expect(page).not.toHaveURL(/\/fr\/compte$/);
  await page.goto(`${invitation.pathname}${invitation.search}`);
  await expect(
    page.getByRole("heading", { name: "Un ami t'offre 5 crédits" }),
  ).toBeVisible();
  await expectNoAccessibilityViolations(page);
  await page.getByRole("button", { name: "Accepter et créer mon CV" }).click();
  await expect(page).toHaveURL(/\/fr\/creer$/);

  // Le filleul crée son compte, puis son premier CV (gratuit) : 5 crédits pour lui.
  await signUp(page);
  await saveDraft(page);
  await generate(page);
  // L'en-tête garde le solde affiché avant la génération : relu au rechargement.
  await page.reload();
  await expect(
    page
      .getByRole("banner")
      .getByRole("button", { name: "5 crédits, voir le détail" }),
  ).toBeVisible();

  // Le parrain voit son filleul et ses 5 crédits.
  await page.goto("/fr/compte");
  await page.getByRole("button", { name: fr.account.signOut }).click();
  await expect(page).not.toHaveURL(/\/fr\/compte$/);
  await page.goto("/fr/connexion");
  await signInWithCode(page, parrain);
  await expect(page).toHaveURL(/\/fr\/compte$/);
  await expect(
    page.getByText("1 ami inscrit avec ton lien · 5 crédits gagnés"),
  ).toBeVisible();
});

test("invitation inconnue : création du CV proposée, rien n'est gardé", async ({
  page,
}) => {
  await page.goto("/fr/invitation/zzzzzzzz");
  await expect(
    page.getByRole("heading", { name: "Invitation introuvable" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Créer mon CV gratuitement" }),
  ).toBeVisible();
});
