import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { LEGAL_CONTENT } from "../../src/features/legal/content";
import de from "../../messages/de.json";
import en from "../../messages/en.json";
import es from "../../messages/es.json";
import fr from "../../messages/fr.json";
import it_ from "../../messages/it.json";

/** Texte affiché d'un message à balises de mise en forme (ex. `<highlight>`). */
const plainText = (message: string) => message.replace(/<\/?\w+>/g, "");

const CATALOGS = { fr, en, it: it_, es, de } as const;
type Locale = keyof typeof CATALOGS;
const LOCALES = Object.keys(CATALOGS) as Locale[];

const CREATE_PATHS: Record<Locale, string> = {
  fr: "/fr/creer",
  en: "/en/create",
  it: "/it/crea",
  es: "/es/crear",
  de: "/de/erstellen",
};
const PRICING_PATHS: Record<Locale, string> = {
  fr: "/fr/tarifs",
  en: "/en/pricing",
  it: "/it/prezzi",
  es: "/es/precios",
  de: "/de/preise",
};
const LEGAL_PATHS: Record<
  Locale,
  Record<"legalNotice" | "terms" | "privacy" | "cookies", string>
> = {
  fr: {
    legalNotice: "/fr/mentions-legales",
    terms: "/fr/cgv",
    privacy: "/fr/confidentialite",
    cookies: "/fr/cookies",
  },
  en: {
    legalNotice: "/en/legal-notice",
    terms: "/en/terms",
    privacy: "/en/privacy",
    cookies: "/en/cookies",
  },
  it: {
    legalNotice: "/it/note-legali",
    terms: "/it/termini",
    privacy: "/it/privacy",
    cookies: "/it/cookie",
  },
  es: {
    legalNotice: "/es/aviso-legal",
    terms: "/es/condiciones",
    privacy: "/es/privacidad",
    cookies: "/es/cookies",
  },
  de: {
    legalNotice: "/de/impressum",
    terms: "/de/agb",
    privacy: "/de/datenschutz",
    cookies: "/de/cookies",
  },
};

async function expectNoAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
}

async function expectNoHorizontalScroll(page: Page) {
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflows).toBe(false);
}

test.describe("Accueil (US-01, US-02, US-03)", () => {
  test("présente la promesse, les 6 fonctionnalités et les offres", async ({
    page,
  }) => {
    await page.goto("/fr");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      plainText(fr.home.title),
    );
    await expect(
      page.getByRole("link", { name: fr.home.cta }).first(),
    ).toBeVisible();
    for (const item of Object.values(fr.home.features.items)) {
      await expect(
        page.getByRole("heading", { level: 3, name: item.title }),
      ).toBeVisible();
    }
    await expect(page.getByText(fr.home.features.paidNote)).toHaveCount(5);
    for (const offer of [
      fr.home.offers.free.name,
      fr.home.offers.credits.name,
      "Essential",
      "Pro",
      "Premium",
      fr.home.offers.cvPro.name,
    ]) {
      await expect(
        page.getByRole("heading", { level: 3, name: offer, exact: true }),
      ).toBeVisible();
    }
    await expect(page.getByText(fr.plans.recommended)).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  for (const locale of LOCALES) {
    test(`en ${locale}, l'appel à l'action mène à la création du CV`, async ({
      page,
    }) => {
      await page.goto(`/${locale}`);

      const cta = page
        .getByRole("link", { name: CATALOGS[locale].home.cta })
        .first();
      await expect(cta).toHaveAttribute("href", CREATE_PATHS[locale]);
    });
  }

  test("affiche le logo fourni en français, son icône et le nom traduit ailleurs", async ({
    page,
  }) => {
    await page.goto("/fr");
    const header = page.getByRole("banner");
    await expect(
      header.getByRole("link").getByRole("img", { name: fr.brand.name }),
    ).toBeVisible();

    await page.goto("/it");
    const logoLink = page.getByRole("banner").getByRole("link").first();
    await expect(logoLink).toHaveAccessibleName(
      `${it_.brand.lead} ${it_.brand.connector} ${it_.brand.pill}`,
    );
    await expect(logoLink.locator("img")).toBeVisible();
  });

  test("la section principale remplit tout le premier écran, contenu visible", async ({
    page,
  }) => {
    await page.goto("/fr");
    const viewport = page.viewportSize();
    if (!viewport) throw new Error("Taille d'écran inconnue");
    const hero = page.locator("main section").first();
    const heroBox = await hero.boundingBox();
    const ctaBox = await page
      .getByRole("link", { name: fr.home.cta })
      .first()
      .boundingBox();
    // La section descend jusqu'au bas de l'écran ; le bouton y est entièrement visible.
    expect(heroBox!.y + heroBox!.height).toBeGreaterThanOrEqual(
      viewport.height,
    );
    expect(ctaBox!.y + ctaBox!.height).toBeLessThanOrEqual(viewport.height);
  });

  test("le lien « Voir tous les tarifs » ouvre la page Tarifs", async ({
    page,
  }) => {
    await page.goto("/fr");

    await page.getByRole("link", { name: fr.home.offers.seeAll }).click();

    await expect(page).toHaveURL(/\/fr\/tarifs$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      fr.pricing.title,
    );
  });

  test("ne présente aucune violation d'accessibilité détectable", async ({
    page,
  }) => {
    await page.goto("/de");
    await expectNoAccessibilityViolations(page);
  });
});

test.describe("Tarifs (US-03)", () => {
  test("affiche les prix mensuels puis annuels avec les économies réelles", async ({
    page,
  }) => {
    await page.goto("/fr/tarifs");

    for (const price of ["3,99 €", "6,99 €", "9,99 €"]) {
      await expect(
        page.locator("article").getByText(price, { exact: true }),
      ).toBeVisible();
    }

    await page.getByRole("button", { name: fr.pricing.billing.yearly }).click();

    for (const price of ["29,99 €", "39,99 €", "69,99 €"]) {
      await expect(
        page.locator("article").getByText(price, { exact: true }),
      ).toBeVisible();
    }
    for (const percent of [37, 52, 42]) {
      await expect(
        page.getByText(
          fr.pricing.savings.replace("{percent}", String(percent)),
        ),
      ).toBeVisible();
    }
  });

  test("présente les offres sans abonnement et les conditions avant toute souscription", async ({
    page,
  }) => {
    await page.goto("/fr/tarifs");

    for (const price of ["2,99 €", "6,99 €", "14,99 €", "4,99 €"]) {
      await expect(
        page.getByText(price, { exact: true }).first(),
      ).toBeVisible();
    }
    await expect(
      page
        .getByText(fr.pricing.withoutSubscription.cvPro.title, { exact: true })
        .first(),
    ).toBeVisible();
    await expect(
      page.getByText(fr.pricing.withoutSubscription.adsRemoval.title),
    ).toHaveCount(0);
    await expect(
      page.getByText(
        fr.pricing.conditions.replace("{days}", "3").replace("{credits}", "10"),
      ),
    ).toBeVisible();
    // ADR-002 : seul l'historique des CV est illimité (§12) ; jamais les crédits, CV ou lettres.
    const textWithoutHistory = (
      await page.locator("main").innerText()
    ).replaceAll(fr.plans.features.unlimitedHistory, "");
    expect(textWithoutHistory).not.toMatch(/illimit/i);
  });

  test("expose l'adresse canonique et les versions dans les autres langues", async ({
    page,
  }) => {
    await page.goto("/fr/tarifs");

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/fr\/tarifs$/,
    );
    for (const locale of LOCALES) {
      await expect(
        page.locator(`link[rel="alternate"][hreflang="${locale}"]`),
      ).toHaveAttribute("href", new RegExp(`${PRICING_PATHS[locale]}$`));
    }
  });

  for (const locale of LOCALES) {
    test(`existe en ${locale} à une adresse traduite`, async ({ page }) => {
      const response = await page.goto(PRICING_PATHS[locale]);

      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        CATALOGS[locale].pricing.title,
      );
      await expectNoHorizontalScroll(page);
    });
  }

  test("ne présente aucune violation d'accessibilité détectable", async ({
    page,
  }) => {
    await page.goto("/fr/tarifs");
    await expectNoAccessibilityViolations(page);
  });
});

test.describe("Pages légales (US-38)", () => {
  test("sont accessibles depuis le pied de page", async ({ page }) => {
    await page.goto("/fr");

    const footer = page.getByRole("contentinfo");
    await footer.getByRole("link", { name: fr.nav.terms }).click();

    await expect(page).toHaveURL(/\/fr\/cgv$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      LEGAL_CONTENT.fr.pages.terms.title,
    );
  });

  for (const locale of LOCALES) {
    test(`existent dans les 4 versions en ${locale}`, async ({ page }) => {
      for (const [legalPage, path] of Object.entries(LEGAL_PATHS[locale])) {
        const response = await page.goto(path);

        expect(response?.status(), path).toBe(200);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
          LEGAL_CONTENT[locale].pages[
            legalPage as keyof (typeof LEGAL_PATHS)["fr"]
          ].title,
        );
      }
    });
  }

  test("ne présentent aucune violation d'accessibilité détectable", async ({
    page,
  }) => {
    await page.goto("/fr/confidentialite");
    await expectNoAccessibilityViolations(page);
  });
});
