import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  expectNoAccessibilityViolations,
  MESSAGES,
  signUp,
} from "./support/accounts";
import { activateSubscription, fulfillPack } from "./support/admin";
import { generate, saveDraft } from "./support/cv";

// Paiements (Inc-6) : écrans et droits. Le paiement lui-même passe par Stripe : sans clé de
// test dans l'environnement, l'achat affiche un message clair (tâche manuelle 4). Les achats
// et abonnements sont posés comme les enregistre le webhook.

const { fr } = MESSAGES;

test("un visiteur qui choisit une formule passe d'abord par la connexion", async ({
  page,
}) => {
  await page.goto("/fr/tarifs");
  await page.getByRole("button", { name: "Choisir Pro" }).click();
  await expect(page).toHaveURL(/\/fr\/connexion\?next=%2Ffr%2Ftarifs$/);
});

test("sans abonnement : formule, essai, recharge, et paiement indisponible signalé clairement", async ({
  page,
}) => {
  await signUp(page);
  await page.goto("/fr/compte/credits");

  const main = page.getByRole("main");
  await expect(main.getByText(fr.billing.plan.none)).toBeVisible();
  await expect(
    main.getByRole("button", { name: "Essayer Pro gratuitement 3 jours" }),
  ).toBeVisible();
  await expectNoAccessibilityViolations(page);

  await main.getByRole("button", { name: /^15 crédits — 6,99/ }).click();
  await expect(main.getByRole("alert")).toHaveText(fr.errors.PAYMENT_ERROR);
});

test("retour de paiement : le solde est mis à jour dès la confirmation (US-18 c.3, c.4)", async ({
  page,
}) => {
  const email = await signUp(page);
  const sessionId = `cs_test_${randomUUID()}`;

  await page.goto(`/fr/compte/credits?paiement=ok&session_id=${sessionId}`);
  const main = page.getByRole("main");
  await expect(main.getByText(fr.billing.return.pending)).toBeVisible();
  // Le webhook arrive pendant l'attente.
  await fulfillPack(email, sessionId);
  await expect(main.getByText(fr.billing.return.done)).toBeVisible();
  await expect(
    page.getByRole("banner").getByRole("button", { name: /^15 crédits/ }),
  ).toBeVisible();
  await expect(main.getByText("Pack de 15 crédits")).toBeVisible();

  await page.goto("/fr/compte/credits?paiement=annule");
  await expect(main.getByText(fr.billing.return.cancelled)).toBeVisible();
});

test("abonné : formule affichée, CV Pro inutile, encart vers la formule supérieure (US-15 c.3, US-17)", async ({
  page,
}) => {
  const email = await signUp(page);
  await saveDraft(page);
  await generate(page);
  const cvPage = page.url();

  // Sans droit : offre CV Pro et DOCX verrouillé.
  await expect(
    page.getByRole("button", { name: fr.billing.cvPro.unlock }),
  ).toBeVisible();

  await activateSubscription(email, "pro");
  await page.goto("/fr/compte/credits");
  const main = page.getByRole("main");
  await expect(main.getByText("Pro · mensuelle")).toBeVisible();
  await expect(main.getByText(/^Renouvelée le/)).toBeVisible();
  await expect(
    main.getByRole("button", { name: fr.billing.plan.manage }),
  ).toBeVisible();
  await expect(main.getByText(/Remis à 60 le/)).toBeVisible();

  await page.goto(cvPage);
  await expect(
    page.getByRole("link", { name: fr.cvExport.docx }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: fr.billing.cvPro.unlock }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("complementary", { name: "Passe à Premium" }),
  ).toBeVisible();

  // Un abonné ne peut pas souscrire une seconde formule (US-20 c.4).
  await page.goto("/fr/tarifs");
  await page.getByRole("button", { name: "Choisir Premium" }).click();
  await expect(page.getByText(fr.billing.conflict.subscribed)).toBeVisible();
});
