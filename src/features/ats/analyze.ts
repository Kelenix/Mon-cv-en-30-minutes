// Test ATS gratuit (ADR-052, docs/acquisition.md §4.3) : ce qu'un logiciel de recrutement (ATS)
// peut lire d'un CV en PDF. Sans IA, donc sans coût : des contrôles simples et vérifiables sur le
// texte extrait, dans les 5 langues du site.

export type AtsStatus = "pass" | "warn" | "fail";

export const ATS_CHECKS = [
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
] as const;

export type AtsCheckId = (typeof ATS_CHECKS)[number];

export type AtsCheck = { id: AtsCheckId; status: AtsStatus };

export type AtsReport = {
  /** Note sur 100. */
  score: number;
  checks: AtsCheck[];
  words: number;
  pages: number;
};

/** Poids de chaque contrôle dans la note (total : 100). */
const WEIGHTS: Record<AtsCheckId, number> = {
  readable: 20,
  email: 10,
  phone: 5,
  experience: 15,
  education: 10,
  skills: 10,
  length: 10,
  pages: 5,
  dates: 5,
  results: 5,
  characters: 5,
};

/** Intitulés de rubrique reconnus, sans accents ni majuscules. */
const HEADINGS: Record<"experience" | "education" | "skills", string[]> = {
  experience: [
    "experience",
    "experiences",
    "parcours professionnel",
    "emplois",
    "work history",
    "employment",
    "esperienza",
    "esperienze",
    "experiencia",
    "berufserfahrung",
    "erfahrung",
    "werdegang",
  ],
  education: [
    "formation",
    "formations",
    "diplome",
    "diplomes",
    "etudes",
    "education",
    "qualifications",
    "istruzione",
    "formazione",
    "educacion",
    "formacion",
    "estudios",
    "ausbildung",
    "bildung",
    "studium",
  ],
  skills: [
    "competences",
    "skills",
    "competenze",
    "habilidades",
    "competencias",
    "kenntnisse",
    "fahigkeiten",
    "kompetenzen",
  ],
};

const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/;
const PHONE = /\+?\d[\d .()/-]{7,}\d/g;
const YEAR = /\b(19[5-9]\d|20[0-4]\d)\b/g;
const RESULT =
  /\d+\s?%|\d[\d .]*\s?(€|k€|\$|£|clients?|personnes|people|projets?|projects?|progett[io]|proyectos?|projekte?|mitarbeiter)/i;
const WORD = /\p{L}[\p{L}'’-]*/gu;
/** Caractère de remplacement (texte mal encodé) ou zone privée (icônes, polices décoratives). */
const ODD_CHARACTER = new RegExp(
  `[${String.fromCodePoint(0xfffd)}${String.fromCodePoint(0xe000)}-${String.fromCodePoint(0xf8ff)}]`,
  "g",
);

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Une rubrique est trouvée si une ligne courte commence par l'un de ses intitulés. */
function hasHeading(lines: string[], names: string[]) {
  return lines.some((line) => {
    const clean = normalize(line)
      .replace(/[^a-z ]/g, " ")
      .trim();
    return (
      clean.length > 0 &&
      clean.length <= 50 &&
      names.some((name) => clean === name || clean.startsWith(`${name} `))
    );
  });
}

function between(
  value: number,
  pass: [number, number],
  warn: [number, number],
): AtsStatus {
  if (value >= pass[0] && value <= pass[1]) return "pass";
  if (value >= warn[0] && value <= warn[1]) return "warn";
  return "fail";
}

/** Analyse le texte extrait d'un CV en PDF (`pages` : nombre de pages du fichier). */
export function analyzeCv({
  text,
  pages,
}: {
  text: string;
  pages: number;
}): AtsReport {
  const words = text.match(WORD)?.length ?? 0;
  // Moins de 40 mots lisibles : CV scanné ou en image, illisible pour un ATS.
  if (words < 40) {
    return {
      score: 0,
      checks: [{ id: "readable", status: "fail" }],
      words,
      pages,
    };
  }

  const lines = text.split(/\r?\n/);
  const phones = (text.match(PHONE) ?? []).filter(
    (match) => match.replace(/\D/g, "").length >= 9,
  );
  const years = new Set(text.match(YEAR) ?? []);
  const oddShare = (text.match(ODD_CHARACTER)?.length ?? 0) / text.length;

  const status: Record<AtsCheckId, AtsStatus> = {
    readable: "pass",
    email: EMAIL.test(text) ? "pass" : "fail",
    phone: phones.length > 0 ? "pass" : "warn",
    experience: hasHeading(lines, HEADINGS.experience) ? "pass" : "fail",
    education: hasHeading(lines, HEADINGS.education) ? "pass" : "fail",
    skills: hasHeading(lines, HEADINGS.skills) ? "pass" : "warn",
    length: between(words, [200, 900], [120, 1300]),
    pages: between(pages, [1, 2], [3, 3]),
    dates: years.size >= 2 ? "pass" : "warn",
    results: RESULT.test(text) ? "pass" : "warn",
    characters: oddShare <= 0.01 ? "pass" : "warn",
  };

  const score = ATS_CHECKS.reduce(
    (total, id) =>
      total +
      (status[id] === "pass"
        ? WEIGHTS[id]
        : status[id] === "warn"
          ? WEIGHTS[id] / 2
          : 0),
    0,
  );

  return {
    score: Math.round(score),
    checks: ATS_CHECKS.map((id) => ({ id, status: status[id] })),
    words,
    pages,
  };
}
