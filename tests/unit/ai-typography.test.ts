import { describe, expect, it } from "vitest";
import { deepWithoutDashes, withoutDashes } from "@/features/ai/typography";
import { period, titleLine } from "@/features/cv/content";

// Aucun tiret cadratin ni demi-cadratin dans les CV et les textes générés (demande de
// l'utilisateur : ils font « texte écrit par une IA »).
describe("withoutDashes", () => {
  it("remplace une incise par une virgule", () => {
    expect(withoutDashes("Gestion d'une équipe — 5 personnes")).toBe(
      "Gestion d'une équipe, 5 personnes",
    );
    expect(withoutDashes("Ventes en hausse–sans budget")).toBe(
      "Ventes en hausse, sans budget",
    );
  });

  it("garde un trait d'union dans les intervalles", () => {
    expect(withoutDashes("De 2019–2021, puis 10 — 20 %")).toBe(
      "De 2019-2021, puis 10-20 %",
    );
  });

  it("retire le tiret d'une ligne de liste et la virgule orpheline", () => {
    expect(withoutDashes("— Premier point\n— Second point —")).toBe(
      "Premier point\nSecond point",
    );
    expect(withoutDashes("Résultat — .")).toBe("Résultat.");
  });

  it("laisse intact un texte sans tiret long, virgules de fin de ligne comprises", () => {
    for (const text of [
      "Développeur full-stack, React et Node.js (3 ans).",
      "Madame, Monsieur,\n\nJe vous écris…\n\nCordialement,\nAwa Diallo",
      "Dear Hiring Manager,",
    ]) {
      expect(withoutDashes(text)).toBe(text);
    }
  });

  it("nettoie toute une sortie structurée", () => {
    expect(
      deepWithoutDashes({
        summary: "Comptable — 8 ans",
        bullets: ["A — B", "C"],
        count: 2,
      }),
    ).toEqual({
      summary: "Comptable, 8 ans",
      bullets: ["A, B", "C"],
      count: 2,
    });
  });
});

describe("séparateurs du CV", () => {
  it("poste et entreprise séparés par une virgule", () => {
    expect(titleLine("Consultant SAP", "Accenture")).toBe(
      "Consultant SAP, Accenture",
    );
    expect(titleLine("Consultant SAP", "")).toBe("Consultant SAP");
  });

  it("période avec un simple trait d'union", () => {
    expect(period("2021", "2024")).toBe("2021 - 2024");
    expect(period("2021")).toBe("2021");
    expect(period(undefined, "2024")).toBe("2024");
  });
});
