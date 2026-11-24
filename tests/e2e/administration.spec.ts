import { expect, test } from "@playwright/test";
import {
  expectNoAccessibilityViolations,
  MESSAGES,
  signInWithCode,
  signUp,
} from "./support/accounts";
import { deleteUserIfExists } from "./support/admin";

// Espace d'administration (Inc-14, ADR-040). L'administrateur de test est déclaré dans
// `ADMIN_EMAILS` (CI et commande locale) et recréé à chaque passage ; un seul projet l'utilise.

const ADMIN = "admin-e2e@exemple.test";
const { fr } = MESSAGES;

test.describe.configure({ mode: "serial" });
test.skip(
  ({ isMobile }) => isMobile,
  "Compte administrateur unique : un seul projet de navigateur",
);

test("sans connexion, l'administration renvoie vers la connexion", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/fr\/connexion\?next=%2Fadmin$/);
});

test("un compte ordinaire tombe sur une page introuvable", async ({ page }) => {
  await signUp(page);
  const response = await page.goto("/admin/utilisateurs");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    fr.notFound.title,
  );
  await page.goto("/fr/compte");
  await expect(page.getByRole("link", { name: fr.nav.admin })).toHaveCount(0);
});

test("l'administrateur consulte les tableaux de bord, offre des crédits et retrouve l'action au journal", async ({
  browser,
  page,
}) => {
  const customer = await signUp(page);

  await deleteUserIfExists(ADMIN);
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  // Connexion : directement le tableau de bord, sans espace « Mon compte » ni étape du prénom.
  await admin.goto("/fr/connexion");
  await signInWithCode(admin, ADMIN);
  await expect(admin).toHaveURL(/\/admin$/);
  await expect(
    admin.getByRole("heading", { level: 1, name: "Vue d'ensemble" }),
  ).toBeVisible();
  await expect(admin.getByText("Comptes", { exact: true })).toBeVisible();
  await expectNoAccessibilityViolations(admin);

  const nav = admin.getByRole("navigation", { name: "Administration" });
  for (const [link, title] of [
    ["Revenus et paiements", "Revenus et paiements"],
    ["Intelligence artificielle", "Intelligence artificielle"],
    ["Provenance", "Provenance"],
    ["État du système", "État du système"],
  ] as const) {
    await nav.getByRole("link", { name: link }).click();
    await expect(
      admin.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
  }
  await expect(admin.getByText("Base de données").first()).toBeVisible();

  await nav.getByRole("link", { name: "Utilisateurs" }).click();
  await admin.getByRole("searchbox", { name: "Rechercher" }).fill(customer);
  await admin.getByRole("button", { name: "Filtrer" }).click();
  await admin.getByRole("link", { name: "Awa Diallo" }).click();
  await expect(
    admin.getByRole("heading", { level: 1, name: "Awa Diallo" }),
  ).toBeVisible();
  await expect(admin.getByText(customer).first()).toBeVisible();
  await expectNoAccessibilityViolations(admin);

  await admin.getByLabel("Crédits", { exact: true }).fill("7");
  await admin.getByLabel(/Motif/).fill("Geste commercial");
  await admin.getByRole("button", { name: "Offrir les crédits" }).click();
  await expect(admin.getByText("7 crédits offerts.")).toBeVisible();

  await nav.getByRole("link", { name: "Journal" }).click();
  const row = admin.getByRole("row", { name: new RegExp(customer) });
  await expect(row).toContainText("Crédits offerts");
  await expect(row).toContainText("7 crédits · Geste commercial");

  await nav.getByRole("link", { name: "Profil" }).click();
  await admin.getByLabel("Prénom").fill("Ada");
  await admin.getByLabel("Nom", { exact: true }).fill("Admin");
  await admin.getByRole("button", { name: "Enregistrer" }).click();
  await expect(admin.getByText("Profil enregistré.")).toBeVisible();
  await expectNoAccessibilityViolations(admin);

  // Sur le site : seul le lien vers l'administration ; « Mon compte » renvoie au tableau de bord.
  await admin.goto("/fr");
  const header = admin.getByRole("banner");
  await expect(header.getByRole("link", { name: fr.nav.account })).toHaveCount(
    0,
  );
  await header.getByRole("link", { name: fr.nav.admin }).click();
  await expect(admin).toHaveURL(/\/admin$/);
  await admin.goto("/fr/compte");
  await expect(admin).toHaveURL(/\/admin$/);

  await nav.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(admin).toHaveURL(/\/fr$/);
  await admin.goto("/admin");
  await expect(admin).toHaveURL(/\/fr\/connexion\?next=%2Fadmin$/);

  await adminContext.close();
});
