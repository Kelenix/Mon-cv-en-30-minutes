import { describe, expect, it } from "vitest";
import { analyzeCv } from "@/features/ats/analyze";

// Test ATS (ADR-052) : contrôles sur le texte extrait d'un CV, sans IA.

const GOOD_CV = `Awa Diallo
Comptable
awa.diallo@email.fr · 06 12 34 56 78 · Lyon

Profil
Comptable depuis 6 ans en cabinet, spécialisée en paie et en fiscalité des PME.

Expériences professionnelles
Comptable, Cabinet Martin, Lyon
2020 - 2026
• Tenue de la comptabilité de 45 clients, du rapprochement bancaire au bilan.
• Réduction de 20 % des délais de clôture mensuelle grâce à de nouveaux tableaux de bord.
Assistante comptable, KPMG, Lyon
2018 - 2020
• Saisie des pièces, préparation des déclarations de TVA et suivi des relances clients.

Formation
BTS Comptabilité et gestion, Lycée La Martinière, 2018

Compétences
Sage, SAP, Excel avancé, paie, fiscalité, rigueur, sens du service.

Langues
Anglais professionnel, wolof courant.

Centres d'intérêt
Course à pied, bénévolat dans une association d'aide aux devoirs.
${"Missions variées auprès de clients de tous secteurs, en autonomie et en équipe. ".repeat(12)}`;

function status(report: ReturnType<typeof analyzeCv>, id: string) {
  return report.checks.find((check) => check.id === id)?.status;
}

describe("analyzeCv", () => {
  it("donne une bonne note à un CV complet et lisible", () => {
    const report = analyzeCv({ text: GOOD_CV, pages: 1 });
    expect(report.score).toBeGreaterThanOrEqual(90);
    for (const id of [
      "readable",
      "email",
      "phone",
      "experience",
      "education",
      "skills",
      "length",
      "pages",
      "dates",
      "results",
      "characters",
    ]) {
      expect(status(report, id), id).toBe("pass");
    }
  });

  it("reconnaît les rubriques dans les autres langues", () => {
    const text = GOOD_CV.replace(
      "Expériences professionnelles",
      "Berufserfahrung",
    )
      .replace("Formation", "Ausbildung")
      .replace("Compétences", "Kenntnisse");
    const report = analyzeCv({ text, pages: 1 });
    expect(status(report, "experience")).toBe("pass");
    expect(status(report, "education")).toBe("pass");
    expect(status(report, "skills")).toBe("pass");
  });

  it("signale un CV scanné ou en image (texte illisible)", () => {
    const report = analyzeCv({ text: "Awa Diallo", pages: 1 });
    expect(report.score).toBe(0);
    expect(report.checks).toEqual([{ id: "readable", status: "fail" }]);
  });

  it("repère les manques : e-mail, rubriques, longueur, pages", () => {
    const text = `Awa Diallo\nComptable rigoureuse et motivée.\n${"Je travaille en équipe et je suis organisée. ".repeat(10)}`;
    const report = analyzeCv({ text, pages: 4 });
    expect(status(report, "email")).toBe("fail");
    expect(status(report, "experience")).toBe("fail");
    expect(status(report, "education")).toBe("fail");
    expect(status(report, "skills")).toBe("warn");
    expect(status(report, "pages")).toBe("fail");
    expect(status(report, "dates")).toBe("warn");
    expect(report.score).toBeLessThan(50);
  });

  it("signale des caractères illisibles (icônes, police non standard)", () => {
    const report = analyzeCv({
      text: `${GOOD_CV}${String.fromCodePoint(0xfffd).repeat(60)}`,
      pages: 1,
    });
    expect(status(report, "characters")).toBe("warn");
  });
});
