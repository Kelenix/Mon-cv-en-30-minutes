import { describe, expect, it } from "vitest";
import {
  allGuideSlugs,
  GUIDE_LOCALES,
  guideBySlug,
  guidesFor,
  headingId,
} from "@/features/guides/catalog";
import { routing } from "@/i18n/routing";

// Rubrique « Conseils » (ADR-052) : chaque article respecte les règles de référencement et de
// style du site, et ses liens mènent à des articles existants.
const LONG_DASH = new RegExp(
  `[${String.fromCodePoint(0x2013)}${String.fromCodePoint(0x2014)}]`,
);

describe("articles de conseils", () => {
  const all = routing.locales.flatMap((locale) =>
    guidesFor(locale).map((guide) => ({ locale, guide })),
  );

  it("la France a ses articles ; les autres langues suivront", () => {
    expect(GUIDE_LOCALES).toEqual(["fr"]);
    expect(guidesFor("fr").length).toBeGreaterThanOrEqual(22);
  });

  it("adresses uniques, titres et descriptions aux longueurs de Google", () => {
    for (const locale of GUIDE_LOCALES) {
      const slugs = guidesFor(locale).map((guide) => guide.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
    for (const { guide } of all) {
      expect(guide.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(guide.metaTitle.length, guide.slug).toBeLessThanOrEqual(60);
      expect(guide.description.length, guide.slug).toBeLessThanOrEqual(155);
      expect(guide.h1, guide.slug).not.toBe(guide.metaTitle);
      expect(guide.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("aucun tiret long, nulle part (demande de l'utilisateur, ADR-049)", () => {
    for (const { guide } of all) {
      expect(JSON.stringify(guide), guide.slug).not.toMatch(LONG_DASH);
    }
  });

  it("liens vers des articles existants de la même langue, ancres uniques", () => {
    for (const { locale, guide } of all) {
      for (const slug of guide.related) {
        expect(
          guideBySlug(locale, slug),
          `${guide.slug} → ${slug}`,
        ).not.toBeNull();
      }
      const ids = guide.sections.map((section) => headingId(section.heading));
      expect(new Set(ids).size, guide.slug).toBe(ids.length);
      expect(ids).not.toContain("questions");
      expect(guide.faq.length, guide.slug).toBeGreaterThanOrEqual(3);
    }
  });

  it("chaque adresse est générée à la compilation", () => {
    expect(allGuideSlugs()).toEqual(
      expect.arrayContaining(guidesFor("fr").map((guide) => guide.slug)),
    );
  });

  it("ancres lisibles, sans accents", () => {
    expect(headingId("Les erreurs à éviter")).toBe("les-erreurs-a-eviter");
    expect(headingId("Faut-il joindre un CV ?")).toBe("faut-il-joindre-un-cv");
  });
});
