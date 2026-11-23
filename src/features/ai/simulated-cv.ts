import "server-only";
import type { CvAnswers } from "@/features/cv/schemas";
import { AiError, type AiUsage } from "./client";
import type { AiCv } from "./cv-writer";

// IA simulée, utilisée tant qu'aucune clé d'API n'est configurée (développement, tests, CI) : le
// CV reprend les réponses telles quelles, sans les traduire ni les reformuler.

/** Présent dans le métier visé, fait échouer la génération simulée (test du remboursement). */
export const SIMULATED_FAILURE = "[simulation:echec]";

/** Durée simulée, pour que les étapes de chargement restent visibles. */
const DELAY_MS = 1_200;

function lines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•*-]+/, "").trim())
    .filter(Boolean);
}

export async function simulateCv(
  answers: CvAnswers,
): Promise<{ cv: AiCv; usage: AiUsage }> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  const usage: AiUsage = {
    model: "simulation",
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    costUsdMicros: 0,
    durationMs: DELAY_MS,
  };
  if (answers.job.includes(SIMULATED_FAILURE)) {
    throw new AiError("AI_UNAVAILABLE", "simulation", usage);
  }

  return {
    usage,
    cv: {
      title: lines(answers.job)[0] ?? answers.job,
      summary: answers.goal,
      experiences: lines(answers.experiences).map((role) => ({
        role,
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        bullets: [],
      })),
      skills: answers.skills
        .split(/[,;\n]/)
        .map((skill) => skill.trim())
        .filter(Boolean),
      education: lines(answers.education).map((degree) => ({
        degree,
        school: "",
        year: "",
        details: "",
      })),
      languages: [],
    },
  };
}
