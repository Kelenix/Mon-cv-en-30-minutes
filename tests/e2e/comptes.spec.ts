import { expect, test } from "@playwright/test";
import {
  emailCount,
  expectNoAccessibilityViolations,
  MESSAGES,
  signInWithCode,
  signUp,
  uniqueEmail,
  waitForEmail,
} from "./support/accounts";

// Comptes (Inc-2) : US-04, US-05, US-06 et US-41 c.2. Supabase local doit tourner (Docker).

const { fr } = MESSAGES;

test.describe("Connexion par code", () => {
  test("une page privée mène à la connexion, puis au prénom et nom, puis à la page demandée", async ({
    page,
  }) => {
    await page.goto("/fr/compte");
    await expect(page).toHaveURL(/\/fr\/connexion\?next=%2Ffr%2Fcompte$/);

    const email = uniqueEmail();
    await signInWithCode(page, email);
    await expect(page).toHaveURL(/\/fr\/bienvenue\?next=%2Ffr%2Fcompte$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      fr.welcome.title,
    );

    await page.getByRole("button", { name: fr.welcome.continue }).click();
    await expect(
      page.getByText(fr.errors.fields.required).first(),
    ).toBeVisible();

    await page.getByLabel(fr.profile.firstName, { exact: true }).fill("Awa");
    await page.getByLabel(fr.profile.lastName, { exact: true }).fill("Diallo");
    await page.getByRole("button", { name: fr.welcome.continue }).click();

    await expect(page).toHaveURL(/\/fr\/compte$/);
    await expect(page.getByText(email)).toBeVisible();
    await expect(
      page.getByLabel(fr.profile.firstName, { exact: true }),
    ).toHaveValue("Awa");
    await expect(
      page.getByRole("link", { name: fr.nav.account }),
    ).toBeVisible();
  });

  test("un code faux est refusé sans quitter la page", async ({ page }) => {
    await page.goto("/fr/connexion");
    const email = uniqueEmail();
    await page.getByLabel(fr.auth.emailLabel).fill(email);
    await page.getByRole("button", { name: fr.auth.sendCode }).click();
    const { code } = await waitForEmail(email);
    const wrongCode = code === "000000" ? "111111" : "000000";

    await page.getByLabel(fr.auth.codeLabel).fill(wrongCode);
    await page.getByRole("button", { name: fr.auth.verify }).click();
    await expect(page.getByText(fr.errors.fields.invalidCode)).toBeVisible();
    await expect(page).toHaveURL(/\/fr\/connexion/);
    await expect(
      page.getByRole("button", { name: /Renvoyer le code/ }),
    ).toBeDisabled();
  });

  test("une adresse e-mail invalide est signalée", async ({ page }) => {
    await page.goto("/fr/connexion");
    await page.getByLabel(fr.auth.emailLabel).fill("pas-une-adresse");
    await page.getByRole("button", { name: fr.auth.sendCode }).click();
    await expect(page.getByText(fr.errors.fields.invalidEmail)).toBeVisible();
  });

  test("le lien de l'e-mail connecte dans la langue du compte", async ({
    page,
    baseURL,
  }) => {
    const { de } = MESSAGES;
    const email = uniqueEmail();
    await page.goto("/de/anmelden");
    await page.getByLabel(de.auth.emailLabel).fill(email);
    await page.getByRole("button", { name: de.auth.sendCode }).click();

    const message = await waitForEmail(email);
    expect(message.subject).toContain("Dein Anmeldecode");
    expect(message.html).toContain("Jetzt anmelden");

    // Le lien pointe vers l'adresse publique du site ; le test le suit sur le serveur testé.
    const href = message.html.match(/href="([^"]+\/auth\/confirm[^"]+)"/)?.[1];
    expect(href).toBeTruthy();
    const link = new URL(href!.replaceAll("&amp;", "&"));
    await page.goto(`${baseURL}${link.pathname}${link.search}`);
    await expect(page).toHaveURL(/\/de\/willkommen\?next=%2Fde%2Fkonto$/);
  });

  test("un lien de connexion invalide renvoie à la connexion avec une explication", async ({
    page,
  }) => {
    await page.goto("/auth/confirm?token_hash=faux&next=%2Fen%2Faccount");
    await expect(page).toHaveURL(/\/en\/sign-in\?erreur=lien$/);
    await expect(page.getByText(MESSAGES.en.auth.linkInvalid)).toBeVisible();
  });

  test("une redirection vers un autre site est ignorée", async ({ page }) => {
    await page.goto("/fr/connexion?next=https%3A%2F%2Fexemple.test%2Fvol");
    await signInWithCode(page, uniqueEmail());
    await expect(page).toHaveURL(/\/fr\/bienvenue\?next=%2Ffr%2Fcompte$/);
  });
});

test.describe("Compte existant", () => {
  test("modification du profil, déconnexion puis reconnexion directe", async ({
    page,
  }) => {
    const email = await signUp(page);

    await page.getByLabel(fr.profile.phone).fill("06 12 ab");
    await page.getByRole("button", { name: fr.account.save }).click();
    await expect(page.getByText(fr.errors.fields.invalidPhone)).toBeVisible();
    await expect(page.getByLabel(fr.profile.phone)).toHaveValue("06 12 ab");

    await page.getByLabel(fr.profile.phone).fill("+33 6 12 34 56 78");
    await page.getByLabel(fr.profile.city).fill("Lyon");
    await page.getByRole("button", { name: fr.account.save }).click();
    await expect(page.getByText(fr.account.saved)).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(fr.profile.city)).toHaveValue("Lyon");

    await page.getByRole("button", { name: fr.account.signOut }).click();
    await expect(page).toHaveURL(/\/fr$/);
    await expect(page.getByRole("link", { name: fr.nav.signIn })).toBeVisible();
    await page.goto("/fr/compte");
    await expect(page).toHaveURL(/\/fr\/connexion\?next=/);

    // Le nom est déjà connu : pas d'étape « Comment t'appelles-tu ? ».
    await signInWithCode(page, email);
    await expect(page).toHaveURL(/\/fr\/compte$/);
  });

  test("une personne connectée qui ouvre la connexion va à son compte", async ({
    page,
  }) => {
    await signUp(page);
    await page.goto("/fr/connexion");
    await expect(page).toHaveURL(/\/fr\/compte$/);
  });

  test("la langue choisie est enregistrée dans le compte", async ({ page }) => {
    const email = await signUp(page);
    await page
      .getByRole("navigation", { name: fr.nav.main })
      .getByRole("button", { name: /Changer de langue/ })
      .click();
    await page.getByRole("menuitemradio", { name: "Deutsch" }).click();
    await expect(page).toHaveURL(/\/de\/konto$/);

    await page
      .getByRole("button", { name: MESSAGES.de.account.signOut })
      .click();
    await expect(page).toHaveURL(/\/de$/);
    const previous = await emailCount(email);
    await page.goto("/fr/connexion");
    await page.getByLabel(fr.auth.emailLabel).fill(email);
    await page.getByRole("button", { name: fr.auth.sendCode }).click();
    // L'e-mail de connexion suit désormais la langue enregistrée.
    expect((await waitForEmail(email, previous)).subject).toContain(
      "Dein Anmeldecode",
    );
  });
});

test.describe("Suppression du compte", () => {
  test("exige le mot de confirmation, supprime le compte et déconnecte", async ({
    page,
  }) => {
    const email = await signUp(page);
    const t = fr.account.delete;

    await page.getByRole("button", { name: t.button }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByText(t.lossCredits)).toBeVisible();
    const confirm = dialog.getByRole("button", { name: t.confirm });
    await expect(confirm).toBeDisabled();
    await dialog
      .getByLabel("Pour confirmer, saisis SUPPRIMER")
      .fill("supprimer");
    await expect(confirm).toBeEnabled();
    await confirm.click();

    await expect(page).toHaveURL(/\/fr\?compte=supprime$/);
    await expect(page.getByText(fr.account.deletedNotice)).toBeVisible();
    await expect(page.getByRole("link", { name: fr.nav.signIn })).toBeVisible();

    // Même adresse : c'est un nouveau compte, sans les données de l'ancien.
    await page.goto("/fr/connexion");
    await signInWithCode(page, email);
    await expect(page).toHaveURL(/\/fr\/bienvenue/);
  });
});

test.describe("Accessibilité des pages de compte", () => {
  test("connexion, bienvenue, compte et fenêtre de suppression", async ({
    page,
  }) => {
    await page.goto("/fr/connexion");
    await expectNoAccessibilityViolations(page);

    const email = uniqueEmail();
    await page.getByLabel(fr.auth.emailLabel).fill(email);
    await page.getByRole("button", { name: fr.auth.sendCode }).click();
    const { code } = await waitForEmail(email);
    await expectNoAccessibilityViolations(page);

    await page.getByLabel(fr.auth.codeLabel).fill(code);
    await page.getByRole("button", { name: fr.auth.verify }).click();
    await expect(page).toHaveURL(/\/fr\/bienvenue/);
    await expectNoAccessibilityViolations(page);

    await page.getByLabel(fr.profile.firstName, { exact: true }).fill("Awa");
    await page.getByLabel(fr.profile.lastName, { exact: true }).fill("Diallo");
    await page.getByRole("button", { name: fr.welcome.continue }).click();
    await expect(page).toHaveURL(/\/fr\/compte$/);
    await expectNoAccessibilityViolations(page);

    await page.getByRole("button", { name: fr.account.delete.button }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });
});
