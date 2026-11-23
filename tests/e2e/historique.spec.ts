import { expect, type Page, test } from "@playwright/test";
import {
  expectNoAccessibilityViolations,
  MESSAGES,
  signUp,
} from "./support/accounts";
import { activateSubscription, createCvs } from "./support/admin";
import { CV_URL, generate, saveDraft } from "./support/cv";

// Historique des CV (Inc-10) : US-31. Supabase local doit tourner (Docker).

const { fr } = MESSAGES;
const t = fr.cvList;
const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

function history(page: Page) {
  return page.getByRole("complementary", { name: t.history.title });
}

function cards(page: Page) {
  return page.getByRole("main").getByRole("listitem");
}

test("vide, puis un CV à ouvrir et à supprimer après confirmation (US-31 c.1, c.5)", async ({
  page,
}) => {
  await signUp(page);
  await page.goto("/fr/cv");
  await expect(page.getByRole("heading", { name: t.emptyTitle })).toBeVisible();
  await expectNoAccessibilityViolations(page);

  await saveDraft(page);
  await generate(page);
  await page.goto("/fr/cv");
  await expect(cards(page)).toHaveCount(1);
  await expect(history(page).getByText("1 CV conservé")).toBeVisible();
  await expect(
    history(page).getByText(/^Ta formule conserve 1 CV/),
  ).toBeVisible();
  await expectNoAccessibilityViolations(page);

  // Un clic ouvre l'aperçu (c.1).
  await page.getByRole("link", { name: "Comptable", exact: true }).click();
  await expect(page).toHaveURL(CV_URL);
  await page.goto("/fr/cv");

  // Suppression : rien sans confirmation, puis CV et contenus supprimés (c.5).
  const remove = page.getByRole("button", {
    name: fill(t.delete.button, { title: "Comptable" }),
  });
  const dialog = page.getByRole("alertdialog", {
    name: fill(t.delete.title, { title: "Comptable" }),
  });
  await remove.click();
  await expect(dialog.getByText(t.delete.description)).toBeVisible();
  await dialog.getByRole("button", { name: t.delete.cancel }).click();
  await expect(cards(page)).toHaveCount(1);

  await remove.click();
  await dialog.getByRole("button", { name: t.delete.confirm }).click();
  await expect(page.getByRole("heading", { name: t.emptyTitle })).toBeVisible();
});

test("Pro : historique illimité, affiché par 12 (US-31 c.2)", async ({
  page,
}) => {
  const email = await signUp(page);
  await createCvs(
    email,
    Array.from({ length: 13 }, (_, index) => `CV ${index + 1}`),
  );
  await activateSubscription(email, "pro");

  await page.goto("/fr/cv");
  await expect(cards(page)).toHaveCount(12);
  await expect(cards(page).first()).toContainText("CV 13");
  await expect(history(page).getByText("13 CV conservés")).toBeVisible();
  await expect(history(page).getByText(t.history.unlimited)).toBeVisible();

  await page
    .getByRole("link", { name: "Afficher plus de CV (12 sur 13)" })
    .click();
  await expect(cards(page)).toHaveCount(13);
  await expect(page.getByRole("link", { name: /Afficher plus/ })).toHaveCount(
    0,
  );
});

test("ancien abonné Pro : il garde ses CV et en remplace un pour en créer un (US-31 c.3, c.4)", async ({
  page,
}) => {
  const email = await signUp(page);
  await createCvs(email, ["Comptable", "Contrôleuse de gestion"]);

  await page.goto("/fr/cv");
  await expect(cards(page)).toHaveCount(2);
  await expect(history(page).getByText(t.history.kept)).toBeVisible();

  await saveDraft(page, { job: "Responsable comptable" });
  await page.goto("/fr/creer/generation");
  const replace = page.getByRole("alertdialog", {
    name: fr.generation.replace.title,
  });
  await replace.getByRole("radio", { name: /Contrôleuse de gestion/ }).check();
  await replace
    .getByRole("button", { name: fr.generation.replace.confirm })
    .click();
  await expect(page).toHaveURL(CV_URL, { timeout: 20_000 });

  await page.goto("/fr/cv");
  await expect(cards(page)).toHaveCount(2);
  await expect(
    page.getByRole("link", { name: "Responsable comptable", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Contrôleuse de gestion" }),
  ).toHaveCount(0);
});
