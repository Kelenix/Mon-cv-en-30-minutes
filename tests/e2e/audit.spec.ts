import { expect, type Page, test } from "@playwright/test";
import { expectNoAccessibilityViolations, signUp } from "./support/accounts";
import { generate, saveDraft } from "./support/cv";

// Audit final (Inc-12) : chaque page à 1440, 1024, 768 et 375 px (US-36 c.1) — aucun défilement
// horizontal, champs d'au moins 16 px et zones tactiles d'au moins 44 px sur mobile — sans erreur
// d'accessibilité (US-37 c.4) ni ressource refusée par la Content-Security-Policy.

const WIDTHS = [1440, 1024, 768, 375];

async function audit(page: Page, paths: string[]) {
  const blocked: string[] = [];
  page.on("console", (message) => {
    if (/Content Security Policy|Refused to/i.test(message.text())) {
      blocked.push(`${page.url()} : ${message.text().slice(0, 200)}`);
    }
  });

  for (const path of paths) {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expect(
        page.getByRole("heading", { level: 1 }).first(),
      ).toBeVisible();
      const where = `${path} à ${width} px`;

      expect
        .soft(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
          `défilement horizontal : ${where}`,
        )
        .toBe(true);

      if (width === 375) {
        const { smallFields, smallTargets } = await page.evaluate(() => {
          const visible = (element: Element) => {
            const box = element.getBoundingClientRect();
            return box.width > 0 && box.height > 0;
          };
          const name = (element: Element) =>
            (
              element.getAttribute("aria-label") ??
              element.id ??
              element.textContent ??
              element.tagName
            )
              .trim()
              .slice(0, 40) || element.tagName;
          const fields = [
            ...document.querySelectorAll(
              "input:not([type=checkbox]):not([type=radio]):not([type=hidden]), select, textarea",
            ),
          ].filter(visible);
          return {
            smallFields: fields
              .filter(
                (field) => parseFloat(getComputedStyle(field).fontSize) < 16,
              )
              .map(name),
            smallTargets: [
              ...document.querySelectorAll("button, [role=button]"),
              ...fields,
            ]
              .filter(visible)
              .filter((element) => element.getBoundingClientRect().height < 44)
              .map(name),
          };
        });
        expect
          .soft(smallFields, `champs de moins de 16 px : ${where}`)
          .toEqual([]);
        expect
          .soft(smallTargets, `zones tactiles de moins de 44 px : ${where}`)
          .toEqual([]);
      }
      if (width === 375 || width === 1440) {
        await expectNoAccessibilityViolations(page);
      }
    }
  }
  expect(blocked, "ressources refusées par la CSP").toEqual([]);
}

test.describe("audit final", () => {
  // Les largeurs sont réglées par le test : une seule fois, sur le projet « ordinateur ».
  test.skip(({ isMobile }) => isMobile, "largeurs réglées dans le test");

  test("pages publiques (US-36, US-37)", async ({ page }) => {
    test.setTimeout(240_000);
    await audit(page, [
      "/fr",
      "/fr/tarifs",
      "/fr/modeles-cv",
      "/fr/creer",
      "/fr/connexion",
      "/fr/cgv",
      "/fr/mentions-legales",
      "/fr/confidentialite",
      "/fr/cookies",
      "/fr/page-inconnue",
    ]);
  });

  test("pages du compte et du CV (US-36, US-37)", async ({ page }) => {
    test.setTimeout(300_000);
    await signUp(page);
    await saveDraft(page);
    const cvId = await generate(page);
    await audit(page, [
      "/fr/compte",
      "/fr/compte/credits",
      "/fr/cv",
      `/fr/cv/${cvId}`,
      `/fr/cv/${cvId}/adapter`,
      `/fr/cv/${cvId}/linkedin`,
      `/fr/cv/${cvId}/lettre`,
      `/fr/cv/${cvId}/entretien`,
    ]);
  });
});
