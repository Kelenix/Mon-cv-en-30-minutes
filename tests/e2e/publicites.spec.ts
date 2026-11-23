import { expect, type Page, test } from "@playwright/test";
import {
  expectNoAccessibilityViolations,
  MESSAGES,
  signUp,
} from "./support/accounts";
import { activateSubscription, fulfillAdsRemoval } from "./support/admin";
import { CV_URL, generate, saveDraft } from "./support/cv";

// Publicités (Inc-11) en mode simulation (ADS_MODE=simulation, sans script externe) : US-24,
// US-32 à US-35. Supabase local doit tourner.

const { fr } = MESSAGES;
const t = fr.ads;

test.beforeEach(async ({ page }) => {
  await page.goto("/fr/tarifs");
  test.skip(
    (await page
      .getByRole("contentinfo")
      .getByRole("button", { name: t.consent.manage })
      .count()) === 0,
    "Publicités désactivées sur ce serveur : lancer avec ADS_MODE=simulation.",
  );
});

function ads(page: Page) {
  return page.getByRole("main").getByText(t.label, { exact: true });
}

function balance(page: Page, count: number) {
  const label = count === 1 || count === 0 ? "crédit" : "crédits";
  return page
    .getByRole("banner")
    .getByRole("button", { name: `${count} ${label}, voir le détail` });
}

test.describe("consentement", () => {
  // Aucun choix enregistré : le bandeau doit apparaître.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("bandeau avant toute annonce, Accepter et Refuser au même niveau, modifiable (US-32)", async ({
    page,
  }) => {
    await page.goto("/fr");
    const consent = page.getByRole("region", { name: t.consent.title });
    await expect(consent).toBeVisible();
    // Avant le choix : l'emplacement est réservé mais vide.
    await expect(ads(page)).toHaveCount(1);
    await expect(page.getByText(t.simulation.title)).toHaveCount(0);
    const refuse = consent.getByRole("button", { name: t.consent.refuse });
    const accept = consent.getByRole("button", { name: t.consent.accept });
    await expect(refuse).toHaveClass(
      (await accept.getAttribute("class")) ?? "",
    );
    await expectNoAccessibilityViolations(page);

    await refuse.click();
    await expect(consent).toBeHidden();
    await expect(page.getByText(t.simulation.title)).toBeVisible();

    // « Gérer les cookies » rouvre le choix (c.3), qui reste gardé ensuite.
    await page
      .getByRole("contentinfo")
      .getByRole("button", { name: t.consent.manage })
      .click();
    await consent.getByRole("button", { name: t.consent.accept }).click();
    await page.reload();
    await expect(page.getByText(t.simulation.title)).toBeVisible();
    await expect(consent).toBeHidden();
  });
});

test("bannière et annonce native signalées dans l'historique, aucune sur l'aperçu (US-33 c.1, c.2)", async ({
  page,
}) => {
  await signUp(page);
  await saveDraft(page);
  const cvId = await generate(page);
  await expect(ads(page)).toHaveCount(0);

  await page.goto("/fr/cv");
  await expect(ads(page)).toHaveCount(2);
  await expectNoAccessibilityViolations(page);
  await page.goto("/fr");
  await expect(ads(page)).toHaveCount(1);
  await page.goto(`/fr/cv/${cvId}`);
  await expect(ads(page)).toHaveCount(0);
});

test("abonné : aucune annonce ni vidéo récompensée (US-33 c.4, H26)", async ({
  page,
}) => {
  const email = await signUp(page);
  await activateSubscription(email, "pro");
  for (const path of ["/fr", "/fr/cv", "/fr/compte/credits"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(ads(page)).toHaveCount(0);
  }
  await expect(page.getByText(t.rewarded.offer)).toHaveCount(0);
});

test("vidéo récompensée : rien si elle est interrompue, 1 crédit à la fin (US-35)", async ({
  page,
}) => {
  test.slow();
  await signUp(page);
  await page.goto("/fr/compte/credits");
  await expect(page.getByText(t.rewarded.offer)).toBeVisible();
  const watch = page.getByRole("button", { name: t.rewarded.watch });
  const video = page.getByRole("alertdialog", { name: t.rewarded.dialogTitle });

  await watch.click();
  await video.getByRole("button", { name: t.rewarded.close }).click();
  await expect(page.getByText(t.rewarded.interrupted)).toBeVisible();
  await expect(balance(page, 0)).toBeVisible();

  await watch.click();
  await expect(video).toBeVisible();
  await expect(video).toBeHidden({ timeout: 15_000 });
  await expect(page.getByText(t.rewarded.done)).toBeVisible();
  await expect(balance(page, 1)).toBeVisible();
});

test("la fenêtre « Solde insuffisant » propose aussi l'annonce (US-35 c.1)", async ({
  page,
}) => {
  await signUp(page);
  await saveDraft(page);
  await generate(page);
  await page
    .getByRole("button", { name: "Améliorer l'accroche — 1 crédit" })
    .click();
  await expect(
    page
      .getByRole("alertdialog", { name: "Il te manque 1 crédit" })
      .getByText(t.rewarded.offer),
  ).toBeVisible();
});

test("interstitiel : une seule fois, en quittant l'aperçu, jamais en changeant d'onglet (US-34)", async ({
  page,
}) => {
  test.slow();
  await signUp(page);
  await saveDraft(page);
  const cvId = await generate(page);
  const interstitial = page.getByRole("alertdialog", {
    name: t.interstitial.title,
  });
  const logo = page
    .getByRole("banner")
    .getByRole("link", { name: fr.brand.name });

  // Les onglets restent dans le CV : aucun interstitiel.
  await page.getByRole("link", { name: fr.cvTools.tabs.linkedin }).click();
  await expect(page).toHaveURL(new RegExp(`/fr/cv/${cvId}/linkedin$`));
  await page.getByRole("link", { name: fr.cvTools.tabs.preview }).click();
  await expect(page).toHaveURL(CV_URL);
  // Aperçu affiché : l'interstitiel n'existe qu'une fois l'aperçu montré.
  await expect(page.getByRole("article").first()).toBeVisible();

  await logo.click();
  await expect(interstitial).toBeVisible();
  await expectNoAccessibilityViolations(page);
  await interstitial
    .getByRole("button", { name: t.interstitial.close })
    .click();
  await expect(page).toHaveURL(/\/fr$/);

  // Déjà vu par ce compte : plus jamais.
  await page.goto(`/fr/cv/${cvId}`);
  await expect(page.getByRole("article").first()).toBeVisible();
  await logo.click();
  await expect(page).toHaveURL(/\/fr$/);
  await expect(interstitial).toHaveCount(0);
});

test("retrait des publicités : offre dans les crédits, puis plus aucune annonce (US-24)", async ({
  page,
}) => {
  const email = await signUp(page);
  await page.goto("/fr/compte/credits");
  await expect(
    page.getByRole("button", { name: /^Retirer les publicités — 2,99/ }),
  ).toBeVisible();

  await fulfillAdsRemoval(email);
  await page.reload();
  await expect(page.getByText(fr.billing.ads.removed)).toBeVisible();
  // La vidéo récompensée reste proposée sans abonnement (H26).
  await expect(page.getByText(t.rewarded.offer)).toBeVisible();
  for (const path of ["/fr", "/fr/cv"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(ads(page)).toHaveCount(0);
  }
});
