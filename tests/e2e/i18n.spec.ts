import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import de from "../../messages/de.json";
import en from "../../messages/en.json";
import es from "../../messages/es.json";
import fr from "../../messages/fr.json";
import it_ from "../../messages/it.json";

/** Texte affiché d'un message à balises de mise en forme (ex. `<highlight>`). */
const plainText = (message: string) => message.replace(/<\/?\w+>/g, "");

const CATALOGS = { fr, en, it: it_, es, de } as const;
const LOCALES = Object.keys(CATALOGS) as (keyof typeof CATALOGS)[];

test.describe("Multilingue (US-41)", () => {
  for (const locale of LOCALES) {
    test(`redirige / vers /${locale} selon la langue du navigateur`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ locale });
      const page = await context.newPage();

      await page.goto("/");

      await expect(page).toHaveURL(new RegExp(`/${locale}$`));
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        plainText(CATALOGS[locale].home.title),
      );
      await context.close();
    });
  }

  test("redirige vers l'anglais si la langue du navigateur n'est pas proposée", async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: "pt-BR" });
    const page = await context.newPage();

    await page.goto("/");

    await expect(page).toHaveURL(/\/en$/);
    await context.close();
  });

  test("change de langue avec le sélecteur et mémorise le choix", async ({
    page,
  }) => {
    await page.goto("/fr");

    await page
      .getByRole("button", {
        name: fr.languageSwitcher.change.replace("{language}", fr.locales.fr),
      })
      .first()
      .click();
    await page.getByRole("menuitemradio", { name: fr.locales.de }).click();

    await expect(page).toHaveURL(/\/de$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      plainText(de.home.title),
    );

    await page.goto("/");
    await expect(page).toHaveURL(/\/de$/);
  });

  test("affiche une page 404 traduite pour une adresse inconnue", async ({
    page,
  }) => {
    const response = await page.goto("/it/pagina-inesistente");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      it_.notFound.title,
    );
  });
});

test.describe("Socle (US-36, US-37)", () => {
  test("le nom de marque le plus long tient sans défilement horizontal", async ({
    page,
  }) => {
    await page.goto("/de");

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflows).toBe(false);
    await expect(page.getByRole("link", { name: de.brand.lead })).toBeVisible();
  });

  test("le lien d'évitement mène au contenu", async ({ page }) => {
    await page.goto("/fr");

    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: fr.a11y.skipToContent });
    await expect(skipLink).toBeFocused();
    await skipLink.press("Enter");
    await expect(page).toHaveURL(/#contenu$/);
  });

  test("l'accueil ne présente aucune violation d'accessibilité détectable", async ({
    page,
  }) => {
    await page.goto("/fr");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
