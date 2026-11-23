import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import de from "../../messages/de.json";
import en from "../../messages/en.json";
import es from "../../messages/es.json";
import fr from "../../messages/fr.json";
import it_ from "../../messages/it.json";

// Parité des traductions (US-41, NFR-09) : le français est la référence.
const CATALOGS: Record<string, unknown> = { fr, en, it: it_, es, de };
// Variable ICU : « {nom} » ou « {nom, plural, …} », mais pas le texte d'une forme plurielle
// (« one {credit} », « other {…} »), qui varie selon la langue.
const PLACEHOLDER =
  /(?<!(?:zero|one|two|few|many|other|=\d+)\s*)\{(\w+)\s*[,}]/g;

function flatten(value: unknown, prefix = ""): Map<string, string> {
  const entries = new Map<string, string>();
  if (typeof value === "string") {
    entries.set(prefix, value);
    return entries;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    flatten(child, path).forEach((text, childPath) =>
      entries.set(childPath, text),
    );
  }
  return entries;
}

function placeholdersOf(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER)].map((match) => match[1] ?? "").sort();
}

const reference = flatten(fr);

describe("fichiers de messages", () => {
  it("existe pour chaque langue proposée", () => {
    expect(Object.keys(CATALOGS).sort()).toEqual([...routing.locales].sort());
  });

  describe.each(routing.locales)("langue %s", (locale) => {
    const catalog = flatten(CATALOGS[locale]);

    it("contient exactement les clés du français", () => {
      expect([...catalog.keys()].sort()).toEqual([...reference.keys()].sort());
    });

    it("n'a aucun texte vide", () => {
      const emptyKeys = [...catalog].filter(([, text]) => text.trim() === "");
      expect(emptyKeys).toEqual([]);
    });

    it("garde les mêmes variables que le français", () => {
      reference.forEach((referenceText, key) => {
        expect(placeholdersOf(catalog.get(key) ?? ""), key).toEqual(
          placeholdersOf(referenceText),
        );
      });
    });
  });
});
