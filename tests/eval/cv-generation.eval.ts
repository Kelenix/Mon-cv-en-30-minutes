import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import type { AiUsage } from "@/features/ai/client";
import type { AiCv } from "@/features/ai/cv-writer";
import type { AppLocale } from "@/i18n/routing";
import {
  REFERENCE_PROFILES,
  type ReferenceProfile,
} from "./reference-profiles";

// Génération de CV avec l'IA réelle sur le jeu de référence (US-11 c.4 et c.5, NFR-02, R02, R05).
// Payante (quelques centimes par profil) : jamais en CI, seulement `npm run eval:ai` avec la clé
// dans `.env.local`. Un seul profil : `npm run eval:ai -- -t fr-comptable`. Les contrôles
// automatiques signalent les faits absents des réponses ; le rapport (CV compris) est relu à la
// main : test-results/ai-eval/cv-generation.json.

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const P95_LIMIT_MS = 30_000;

type Result = {
  id: string;
  language: AppLocale;
  ms: number;
  usage?: AiUsage;
  error?: string;
  issues: string[];
  cv?: AiCv;
};
const results: Result[] = [];

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/** Mots fréquents propres à chaque langue (texte normalisé, sans accents). */
const STOPWORDS: Record<AppLocale, string[]> = {
  fr: ["les", "des", "du", "et", "pour", "avec", "dans", "une", "sur", "aux"],
  en: ["the", "and", "of", "to", "for", "with", "on", "an", "at", "from"],
  it: ["il", "gli", "della", "delle", "dei", "per", "nel", "nella", "e", "di"],
  es: ["el", "los", "las", "del", "y", "para", "por", "al", "como", "su"],
  de: ["der", "die", "das", "und", "mit", "fur", "von", "im", "den", "bei"],
};

function detectLanguage(cv: AiCv) {
  const words = normalize(
    [cv.summary, ...cv.experiences.flatMap((item) => item.bullets)].join(" "),
  ).split(" ");
  const scores = Object.entries(STOPWORDS).map(
    ([language, list]) =>
      [language, words.filter((word) => list.includes(word)).length] as const,
  );
  return scores.sort((a, b) => b[1] - a[1])[0][0];
}

/** Écarts avec les réponses : faits absents, termes interdits, langue, symboles. */
function checkFidelity(profile: ReferenceProfile, cv: AiCv) {
  const issues: string[] = [];
  const answers = ` ${normalize(Object.values(profile.answers).join(" "))} `;
  const answerNumbers = new Set(
    Object.values(profile.answers).join(" ").match(/\d+/g),
  );
  const named = [
    ...cv.experiences.map((item) => ["entreprise", item.company] as const),
    ...cv.education.map((item) => ["établissement", item.school] as const),
  ];
  for (const [kind, value] of named) {
    if (value && !answers.includes(` ${normalize(value)} `)) {
      issues.push(`${kind} absent(e) des réponses : « ${value} »`);
    }
  }
  for (const number of new Set(JSON.stringify(cv).match(/\d+/g))) {
    if (!answerNumbers.has(number)) {
      issues.push(`nombre absent des réponses : ${number}`);
    }
  }
  const text = normalize(JSON.stringify(cv));
  for (const term of profile.forbidden ?? []) {
    if (` ${text} `.includes(` ${normalize(term)} `)) {
      issues.push(`terme interdit repris : « ${term} »`);
    }
  }
  if (
    profile.maxExperiences !== undefined &&
    cv.experiences.length > profile.maxExperiences
  ) {
    issues.push(`${cv.experiences.length} expérience(s) sans aucune réponse`);
  }
  const detected = detectLanguage(cv);
  if (detected !== profile.language) {
    issues.push(`langue détectée ${detected} au lieu de ${profile.language}`);
  }
  if (/\p{Extended_Pictographic}/u.test(JSON.stringify(cv))) {
    issues.push("émoji ou symbole décoratif");
  }
  return issues;
}

function percentile95(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(0.95 * sorted.length) - 1];
}

describe("génération de CV, IA réelle, jeu de référence", () => {
  afterAll(() => {
    if (results.length === 0) return;
    mkdirSync("test-results/ai-eval", { recursive: true });
    writeFileSync(
      "test-results/ai-eval/cv-generation.json",
      JSON.stringify(results, null, 2),
    );
    const cost = results.reduce(
      (sum, result) => sum + (result.usage?.costUsdMicros ?? 0),
      0,
    );
    console.log(
      [
        ...results.map(
          (r) =>
            `${r.id.padEnd(24)} ${(r.ms / 1000).toFixed(1).padStart(5)} s  ${r.usage?.model ?? "-"}  ` +
            `${r.usage?.outputTokens ?? 0} tokens  ${r.error ?? (r.issues.join(" | ") || "ok")}`,
        ),
        `P95 : ${(percentile95(results.map((r) => r.ms)) / 1000).toFixed(1)} s · coût estimé : ${(cost / 1e6).toFixed(2)} $`,
      ].join("\n"),
    );
  });

  for (const profile of REFERENCE_PROFILES) {
    it(profile.id, async () => {
      const { getClaude } = await import("@/features/ai/client");
      const { writeCv } = await import("@/features/ai/cv-writer");
      expect(getClaude(), "clé ANTHROPIC_API_KEY absente").not.toBeNull();

      const startedAt = performance.now();
      try {
        const { cv, usage } = await writeCv(profile.answers, profile.language);
        const issues = checkFidelity(profile, cv);
        results.push({
          id: profile.id,
          language: profile.language,
          ms: performance.now() - startedAt,
          usage,
          issues,
          cv,
        });
      } catch (error) {
        results.push({
          id: profile.id,
          language: profile.language,
          ms: performance.now() - startedAt,
          error: String(error),
          issues: [],
        });
        throw error;
      }
    });
  }

  it("95 % des générations en moins de 30 s (US-11 c.4)", () => {
    expect(results).toHaveLength(REFERENCE_PROFILES.length);
    expect(percentile95(results.map((r) => r.ms))).toBeLessThan(P95_LIMIT_MS);
  });
});
