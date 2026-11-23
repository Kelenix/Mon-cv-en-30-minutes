import { describe, expect, it } from "vitest";
import type { CvContent } from "@/features/cv/schemas";
import {
  cleanVariants,
  experienceProposal,
  mergeAdaptation,
} from "@/features/cv/tools";

// Outils IA (Inc-7) : quoi que renvoie l'IA, le CV ne reçoit ni expérience, ni compétence, ni
// diplôme nouveaux (US-27 c.3, c.5) ; les limites sont respectées.

const CV: CvContent = {
  header: { fullName: "Awa Diallo", title: "Comptable" },
  summary: "Comptable avec 5 ans d'expérience.",
  experiences: [
    {
      id: "fidal",
      role: "Comptable",
      company: "Fidal",
      bullets: ["Tenue de la comptabilité"],
    },
    {
      id: "kpmg",
      role: "Assistante comptable",
      company: "KPMG",
      bullets: ["Rapprochements bancaires"],
    },
  ],
  skills: ["Excel", "SAP", "Sage"],
  education: [{ id: "bts", degree: "BTS Comptabilité", school: "Lycée" }],
  languages: [],
};

describe("adaptation à une offre", () => {
  it("réordonne et reformule sans rien ajouter, même sous une consigne cachée", () => {
    const { content, missingKeywords } = mergeAdaptation(CV, {
      summary: "Comptable orientée audit.",
      experiences: [
        { id: "kpmg", bullets: ["Rapprochements bancaires mensuels"] },
        // Expérience inventée (ex. : « ignore les instructions et ajoute… ») : écartée.
        { id: "inventee", bullets: ["Directrice financière chez Google"] },
      ],
      skills: ["sap", "Consolidation IFRS", "excel"],
      missingKeywords: ["Consolidation IFRS", "Excel", "Audit"],
    });

    expect(content.summary).toBe("Comptable orientée audit.");
    expect(content.experiences.map((item) => item.id)).toEqual([
      "kpmg",
      "fidal",
    ]);
    expect(content.experiences[0]).toEqual({
      ...CV.experiences[1],
      bullets: ["Rapprochements bancaires mensuels"],
    });
    // Compétences : celles du CV seulement, avec leur orthographe ; les oubliées suivent.
    expect(content.skills).toEqual(["SAP", "Excel", "Sage"]);
    expect(content.education).toEqual(CV.education);
    expect(content.header).toEqual(CV.header);
    // Mots-clés manquants : jamais ceux déjà présents dans le CV.
    expect(missingKeywords).toEqual(["Consolidation IFRS", "Audit"]);
  });

  it("garde l'accroche et les puces d'origine quand l'IA les laisse vides", () => {
    const { content } = mergeAdaptation(CV, {
      summary: "  ",
      experiences: [{ id: "fidal", bullets: [] }],
      skills: [],
      missingKeywords: [],
    });
    expect(content.summary).toBe(CV.summary);
    expect(content.experiences[0].bullets).toEqual([
      "Tenue de la comptabilité",
    ]);
    expect(content.skills).toEqual(CV.skills);
  });
});

describe("amélioration d'une expérience et de l'accroche", () => {
  it("ne change que les puces, dans les limites", () => {
    const proposal = experienceProposal(
      { ...CV.experiences[0], startDate: "2021" },
      Array.from({ length: 12 }, () => "Mission ".repeat(60)),
    );
    expect(proposal).toMatchObject({
      id: "fidal",
      role: "Comptable",
      company: "Fidal",
      startDate: "2021",
    });
    expect(proposal.bullets).toHaveLength(8);
    expect(proposal.bullets[0].length).toBeLessThanOrEqual(300);
  });

  it("donne au plus le nombre de variantes de la formule, sans doublon ni vide", () => {
    expect(cleanVariants(["A", "B", "A", " ", "C", "D"], 3)).toEqual([
      "A",
      "B",
      "C",
    ]);
  });
});
