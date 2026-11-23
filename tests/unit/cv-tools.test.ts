import { describe, expect, it } from "vitest";
import {
  GENERATED_LIMITS,
  INTERVIEW_LIMITS,
  interviewAnswersSchema,
  letterRequestSchema,
  linkedinOutputSchema,
  wordCount,
} from "@/features/cv/generated";
import type { CvContent } from "@/features/cv/schemas";
import {
  cleanQuestions,
  cleanVariants,
  experienceProposal,
  feedbackFromAi,
  linkedinFromAi,
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

describe("version LinkedIn", () => {
  it("garde une description par expérience du CV, sans expérience inventée", () => {
    const output = linkedinFromAi(CV, {
      headline: "Comptable | Excel | SAP ".repeat(20),
      about: "Je suis comptable.",
      experiences: [
        { id: "kpmg", description: "  Rapprochements bancaires.  " },
        { id: "inventee", description: "Directrice financière chez Google" },
      ],
    });

    expect(output.headline.length).toBeLessThanOrEqual(
      GENERATED_LIMITS.headline,
    );
    expect(output.about).toBe("Je suis comptable.");
    // Poste et entreprise viennent du CV ; l'ordre aussi.
    expect(output.experiences).toEqual([
      {
        id: "fidal",
        role: "Comptable",
        company: "Fidal",
        // Description oubliée par l'IA : les puces du CV.
        description: "Tenue de la comptabilité",
      },
      {
        id: "kpmg",
        role: "Assistante comptable",
        company: "KPMG",
        description: "Rapprochements bancaires.",
      },
    ]);
    expect(linkedinOutputSchema.safeParse(output).success).toBe(true);
  });

  it("refuse une modification qui dépasse les limites de LinkedIn", () => {
    const output = linkedinFromAi(CV, {
      headline: "Comptable",
      about: "",
      experiences: [],
    });
    expect(
      linkedinOutputSchema.safeParse({
        ...output,
        about: "a".repeat(GENERATED_LIMITS.about + 1),
      }).success,
    ).toBe(false);
  });
});

describe("lettre de motivation", () => {
  it("exige le poste visé ; entreprise et annonce sont facultatives", () => {
    const request = letterRequestSchema.safeParse({
      position: "  Comptable  ",
      company: "",
      jobPosting: "",
      language: "fr",
    });
    expect(request.success && request.data.position).toBe("Comptable");

    const missing = letterRequestSchema.safeParse({
      position: " ",
      language: "fr",
    });
    expect(missing.error?.issues[0]).toMatchObject({
      path: ["position"],
      message: "required",
    });
    expect(
      letterRequestSchema.safeParse({
        position: "Comptable",
        jobPosting: "a".repeat(GENERATED_LIMITS.jobPosting + 1),
        language: "fr",
      }).success,
    ).toBe(false);
  });

  it("compte les mots de la lettre", () => {
    expect(wordCount("Madame, Monsieur,\n\nJe postule  au poste.")).toBe(6);
    expect(wordCount("   ")).toBe(0);
  });
});

describe("simulation d'entretien", () => {
  const questions = Array.from(
    { length: 8 },
    (_, index) => `Question ${index + 1} ?`,
  );

  it("garde 8 questions distinctes et bornées, sinon la sortie est refusée", () => {
    expect(
      cleanQuestions([...questions, "Question 1 ?", "Question 9 ?"]),
    ).toEqual(questions);
    expect(
      cleanQuestions(["Q ".repeat(400), ...questions.slice(1)])?.[0].length,
    ).toBeLessThanOrEqual(INTERVIEW_LIMITS.question);
    expect(
      cleanQuestions([...questions.slice(0, 7), "  ", "Question 1 ?"]),
    ).toBeNull();
  });

  it("demande au moins une réponse, de 2 000 caractères au plus", () => {
    const answers = Array<string>(8).fill("");
    expect(
      interviewAnswersSchema.safeParse(answers).error?.issues[0].message,
    ).toBe("required");
    answers[2] = "Ma réponse";
    expect(interviewAnswersSchema.safeParse(answers).success).toBe(true);
    answers[3] = "a".repeat(INTERVIEW_LIMITS.answer + 1);
    expect(interviewAnswersSchema.safeParse(answers).success).toBe(false);
    expect(interviewAnswersSchema.safeParse(["Une seule"]).success).toBe(false);
  });

  it("donne un retour pour chaque question répondue, et pour elles seules", () => {
    const answers = ["Réponse 1", "", "Réponse 3", "", "", "", "", ""];
    const item = (index: number) => ({
      index,
      strengths: `Fort ${index}`,
      improvements: `Mieux ${index}`,
      example: `Exemple ${index}`,
    });

    expect(
      feedbackFromAi(answers, [item(2), item(1), item(0), item(9)]),
    ).toEqual([item(0), item(2)]);
    // Retour manquant ou vide pour une question répondue : sortie refusée.
    expect(feedbackFromAi(answers, [item(0)])).toBeNull();
    expect(
      feedbackFromAi(answers, [item(0), { ...item(2), example: " " }]),
    ).toBeNull();
  });
});
