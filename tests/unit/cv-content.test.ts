import { describe, expect, it } from "vitest";
import type { AiCv } from "@/features/ai/cv-writer";
import { buildCvContent, clip, cvToPlainText } from "@/features/cv/content";
import {
  CV_LIMITS,
  cvAnswersSchema,
  cvContentSchema,
  generateCvSchema,
} from "@/features/cv/schemas";

// Mise en forme du CV (US-11 à US-14) : sortie de l'IA → contenu enregistré → texte copié.

const generated: AiCv = {
  title: "Développeuse web",
  summary: "Développeuse web avec 4 ans d'expérience.",
  experiences: [
    {
      role: "Développeuse web",
      company: "Studio Lumière",
      location: "Lyon",
      startDate: "2021",
      endDate: "Aujourd'hui",
      bullets: ["Création de sites pour des commerces", "  "],
    },
    {
      role: " ",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      bullets: [],
    },
  ],
  skills: ["HTML", "", "React"],
  education: [
    { degree: "Licence pro", school: "Lyon 2", year: "2020", details: "" },
  ],
  languages: [
    { name: "Anglais", level: "courant" },
    { name: "", level: "" },
  ],
};

const account = { fullName: "Awa Diallo", email: "awa@exemple.test" };
let counter = 0;
const newId = () => `id-${++counter}`;

describe("coupe des textes trop longs", () => {
  it("garde un texte court tel quel", () => {
    expect(clip("  Bonjour  ", 20)).toBe("Bonjour");
  });

  it("coupe à la fin d'un mot", () => {
    expect(clip("Gestion de projet agile", 18)).toBe("Gestion de projet");
  });

  it("coupe net un mot unique trop long", () => {
    expect(clip("a".repeat(30), 10)).toBe("a".repeat(10));
  });
});

describe("contenu enregistré à partir de la sortie de l'IA", () => {
  const content = buildCvContent(generated, account, newId);

  it("reprend l'en-tête du compte, sans champ vide (H18)", () => {
    expect(content.header).toEqual({
      fullName: "Awa Diallo",
      title: "Développeuse web",
      email: "awa@exemple.test",
      phone: undefined,
      city: undefined,
    });
  });

  it("retire les éléments vides et attribue des identifiants", () => {
    expect(content.experiences).toHaveLength(1);
    expect(content.experiences[0]).toMatchObject({
      id: expect.stringMatching(/^id-/),
      bullets: ["Création de sites pour des commerces"],
    });
    expect(content.skills).toEqual(["HTML", "React"]);
    expect(content.languages).toHaveLength(1);
    expect(content.education[0].details).toBeUndefined();
  });

  it("respecte toutes les limites et passe la validation", () => {
    const tooMuch = buildCvContent(
      {
        ...generated,
        summary: "mot ".repeat(400),
        experiences: Array.from({ length: 20 }, () => ({
          ...generated.experiences[0],
          bullets: Array.from({ length: 12 }, () => "x ".repeat(200)),
        })),
        skills: Array.from({ length: 50 }, (_, index) => `Compétence ${index}`),
      },
      account,
      newId,
    );
    expect(tooMuch.summary.length).toBeLessThanOrEqual(CV_LIMITS.summary);
    expect(tooMuch.experiences).toHaveLength(CV_LIMITS.experiences);
    expect(tooMuch.experiences[0].bullets).toHaveLength(CV_LIMITS.bullets);
    expect(tooMuch.skills).toHaveLength(CV_LIMITS.skills);
    expect(cvContentSchema.safeParse(tooMuch).success).toBe(true);
  });
});

describe("texte copié (US-13)", () => {
  const titles = {
    summary: "Profil",
    experiences: "Expérience professionnelle",
    skills: "Compétences",
    education: "Formation",
    languages: "Langues",
  };

  it("est organisé par rubriques, dans l'ordre du CV", () => {
    const text = cvToPlainText(
      buildCvContent(generated, account, newId),
      titles,
    );
    expect(text).toBe(
      [
        "Awa Diallo\nDéveloppeuse web\nawa@exemple.test",
        "PROFIL\nDéveloppeuse web avec 4 ans d'expérience.",
        "EXPÉRIENCE PROFESSIONNELLE\nDéveloppeuse web, Studio Lumière, Lyon, 2021 - Aujourd'hui\n- Création de sites pour des commerces",
        "COMPÉTENCES\nHTML, React",
        "FORMATION\nLicence pro, Lyon 2, 2020",
        "LANGUES\nAnglais (courant)",
      ].join("\n\n"),
    );
  });

  it("omet les rubriques vides", () => {
    const text = cvToPlainText(
      {
        header: { fullName: "Awa Diallo", title: "" },
        summary: "",
        experiences: [],
        skills: [],
        education: [],
        languages: [],
      },
      titles,
    );
    expect(text).toBe("Awa Diallo");
  });
});

describe("règles de saisie", () => {
  const answers = {
    job: "Comptable",
    experiences: "",
    skills: "",
    education: "",
    goal: "",
  };

  it("exige seulement le métier visé (H19)", () => {
    expect(cvAnswersSchema.safeParse(answers).success).toBe(true);
    const missing = cvAnswersSchema.safeParse({ ...answers, job: " " });
    expect(missing.error?.issues[0].message).toBe("required");
  });

  it("limite chaque réponse à 2 000 caractères", () => {
    const result = cvAnswersSchema.safeParse({
      ...answers,
      goal: "a".repeat(2001),
    });
    expect(result.error?.issues[0].message).toBe("tooLong");
  });

  it("exige un identifiant de demande et une langue proposée", () => {
    const valid = {
      requestId: crypto.randomUUID(),
      answers,
      language: "en",
    };
    expect(generateCvSchema.safeParse(valid).success).toBe(true);
    expect(
      generateCvSchema.safeParse({ ...valid, requestId: "abc" }).success,
    ).toBe(false);
    expect(
      generateCvSchema.safeParse({ ...valid, language: "pt" }).success,
    ).toBe(false);
  });

  it("refuse plus de 8 points par expérience", () => {
    const content = buildCvContent(generated, account, newId);
    content.experiences[0].bullets = Array.from({ length: 9 }, () => "Point");
    const result = cvContentSchema.safeParse(content);
    expect(result.error?.issues[0].message).toBe("tooMany");
  });
});
