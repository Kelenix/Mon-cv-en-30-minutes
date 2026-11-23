import { describe, expect, it } from "vitest";
import { LEGAL_CONTENT } from "@/features/legal/content";
import { fillParagraphs, fillPlaceholders } from "@/features/legal/interpolate";
import { LEGAL_PAGES, LEGAL_PLACEHOLDERS } from "@/features/legal/types";
import { routing } from "@/i18n/routing";

const PLACEHOLDER = /\{(\w+)\}/g;

function placeholdersOf(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER)].map((match) => match[1] ?? "").sort();
}

const reference = LEGAL_CONTENT.fr;

describe("pages légales (US-38)", () => {
  describe.each(routing.locales)("langue %s", (locale) => {
    const content = LEGAL_CONTENT[locale];

    it.each(LEGAL_PAGES)(
      "%s a la même structure et les mêmes variables que le français",
      (page) => {
        const sections = content.pages[page].sections;
        const referenceSections = reference.pages[page].sections;

        expect(sections.length).toBe(referenceSections.length);
        sections.forEach((section, sectionIndex) => {
          const referenceParagraphs =
            referenceSections[sectionIndex]?.paragraphs ?? [];
          expect(section.paragraphs.length, section.title).toBe(
            referenceParagraphs.length,
          );
          section.paragraphs.forEach((paragraph, paragraphIndex) => {
            expect(placeholdersOf(paragraph), paragraph).toEqual(
              placeholdersOf(referenceParagraphs[paragraphIndex] ?? ""),
            );
          });
        });
      },
    );

    it("n'utilise que des variables connues", () => {
      const used = LEGAL_PAGES.flatMap((page) =>
        content.pages[page].sections.flatMap((section) =>
          section.paragraphs.flatMap(placeholdersOf),
        ),
      );
      const known: readonly string[] = LEGAL_PLACEHOLDERS;
      expect(used.filter((name) => !known.includes(name))).toEqual([]);
    });
  });
});

describe("insertion des informations du vendeur", () => {
  it("remplace les variables connues", () => {
    expect(
      fillPlaceholders(
        "Édité par {companyName}.",
        { companyName: "Exemple SAS" },
        "à fournir",
      ),
    ).toBe("Édité par Exemple SAS.");
  });

  it("signale une information obligatoire manquante", () => {
    expect(fillPlaceholders("Contact : {email}.", {}, "à fournir")).toBe(
      "Contact : [à fournir].",
    );
  });

  it("retire le paragraphe du numéro de TVA s'il n'est pas renseigné", () => {
    const paragraphs = ["Siège : {address}.", "TVA : {vatNumber}."];

    expect(
      fillParagraphs(paragraphs, { address: "Paris" }, "à fournir"),
    ).toEqual(["Siège : Paris."]);
    expect(
      fillParagraphs(
        paragraphs,
        { address: "Paris", vatNumber: "FR00" },
        "à fournir",
      ),
    ).toEqual(["Siège : Paris.", "TVA : FR00."]);
  });
});
