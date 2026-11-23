import { expect, test } from "@playwright/test";
import {
  expectNoAccessibilityViolations,
  MESSAGES,
  signUp,
} from "./support/accounts";
import { grantPurchasedCredits } from "./support/admin";

// Crédits (Inc-3) : affichage du solde (US-07). Supabase local doit tourner (Docker).

const { fr } = MESSAGES;

test("le solde s'affiche dans l'en-tête et dans l'espace compte", async ({
  page,
}) => {
  const email = await signUp(page);
  const banner = page.getByRole("banner");

  // Nouveau compte : aucun crédit, aucun abonnement.
  await expect(
    banner.getByRole("button", { name: "0 crédit, voir le détail" }),
  ).toBeVisible();
  await expect(page.getByText(fr.account.noPlan)).toBeVisible();

  await grantPurchasedCredits(email, 5);
  await page.reload();

  const badge = banner.getByRole("button", {
    name: "5 crédits, voir le détail",
  });
  await expect(badge).toBeVisible();
  await expect(page.getByText("5 crédits", { exact: true })).toBeVisible();

  await badge.click();
  const details = page.getByRole("dialog", { name: fr.credits.title });
  await expect(details.getByText(fr.credits.purchased)).toBeVisible();
  await expect(
    details.getByRole("link", { name: fr.credits.topUp }),
  ).toBeVisible();
  await expectNoAccessibilityViolations(page);

  await details.getByRole("link", { name: fr.credits.topUp }).click();
  await expect(page).toHaveURL(/\/fr\/tarifs$/);
});

test("l'en-tête d'un compte connecté tient sur la largeur, même en allemand", async ({
  page,
}) => {
  await signUp(page);
  await page.goto("/de/konto");
  const logo = await page
    .getByRole("banner")
    .getByRole("link")
    .first()
    .boundingBox();
  const nav = await page
    .getByRole("navigation", { name: MESSAGES.de.nav.main })
    .boundingBox();
  expect(logo!.x + logo!.width).toBeLessThanOrEqual(nav!.x);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
