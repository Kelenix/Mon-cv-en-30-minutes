import type {
  AiAdaptation,
  AiInterviewFeedback,
  AiLinkedin,
} from "@/features/ai/cv-tools-writer";
import { clip } from "./content";
import {
  GENERATED_LIMITS,
  INTERVIEW_LIMITS,
  type InterviewFeedback,
  type LinkedinOutput,
} from "./generated";
import { CV_LIMITS, type CvContent, type CvExperience } from "./schemas";

// Résultats des outils IA ramenés au contenu du CV (US-25 à US-30) : limites appliquées et,
// pour l'adaptation, garantie qu'aucune expérience ni compétence n'est ajoutée (US-27 c.3),
// quelle que soit la sortie de l'IA (y compris sous l'effet d'une consigne cachée).

/** Puces réécrites, bornées ; à défaut, celles d'origine. */
export function cleanBullets(bullets: string[], fallback: string[]) {
  const clean = bullets
    .map((bullet) => clip(bullet, CV_LIMITS.bullet))
    .filter(Boolean)
    .slice(0, CV_LIMITS.bullets);
  return clean.length > 0 ? clean : fallback;
}

/** Proposition pour une expérience : seules les puces changent. */
export function experienceProposal(
  experience: CvExperience,
  bullets: string[],
): CvExperience {
  return { ...experience, bullets: cleanBullets(bullets, experience.bullets) };
}

/** Variantes d'accroche distinctes, bornées, au nombre prévu par la formule (US-26 c.1). */
export function cleanVariants(variants: string[], count: number) {
  return [
    ...new Set(
      variants
        .map((variant) => clip(variant, CV_LIMITS.summary))
        .filter(Boolean),
    ),
  ].slice(0, count);
}

const normalize = (text: string) => text.trim().toLocaleLowerCase();

export function mergeAdaptation(original: CvContent, ai: AiAdaptation) {
  // Expériences : uniquement celles du CV, dans l'ordre proposé ; les oubliées suivent.
  const byId = new Map(original.experiences.map((item) => [item.id, item]));
  const ordered: CvExperience[] = [];
  for (const proposal of ai.experiences) {
    const item = byId.get(proposal.id);
    if (!item) continue;
    byId.delete(proposal.id);
    ordered.push(experienceProposal(item, proposal.bullets));
  }
  ordered.push(...byId.values());

  // Compétences : uniquement celles du CV, avec leur orthographe ; les oubliées suivent.
  const skills = new Map(
    original.skills.map((skill) => [normalize(skill), skill]),
  );
  const orderedSkills: string[] = [];
  for (const proposal of ai.skills) {
    const skill = skills.get(normalize(proposal));
    if (!skill) continue;
    skills.delete(normalize(proposal));
    orderedSkills.push(skill);
  }
  orderedSkills.push(...skills.values());

  const cvText = normalize(JSON.stringify(original));
  const missingKeywords = [
    ...new Set(
      ai.missingKeywords.map((keyword) => clip(keyword, CV_LIMITS.skill)),
    ),
  ]
    .filter((keyword) => keyword && !cvText.includes(normalize(keyword)))
    .slice(0, 15);

  const content: CvContent = {
    ...original,
    summary: clip(ai.summary, CV_LIMITS.summary) || original.summary,
    experiences: ordered,
    skills: orderedSkills,
  };
  return { content, missingKeywords };
}

/** Version LinkedIn (US-28) : limites de LinkedIn, une description par expérience du CV. */
export function linkedinFromAi(
  original: CvContent,
  ai: AiLinkedin,
): LinkedinOutput {
  const descriptions = new Map(
    ai.experiences.map((item) => [item.id, item.description]),
  );
  return {
    headline: clip(ai.headline, GENERATED_LIMITS.headline),
    about: clip(ai.about, GENERATED_LIMITS.about),
    experiences: original.experiences.map((item) => ({
      id: item.id,
      role: item.role,
      company: item.company,
      // Description vide ou oubliée par l'IA : les puces du CV, à reprendre par l'utilisateur.
      description: clip(
        descriptions.get(item.id)?.trim() || item.bullets.join("\n"),
        GENERATED_LIMITS.experience,
      ),
    })),
  };
}

/** 8 questions distinctes et bornées (US-30 c.1) ; null si l'IA en donne moins. */
export function cleanQuestions(questions: string[]): string[] | null {
  const clean = [
    ...new Set(
      questions
        .map((question) => clip(question, INTERVIEW_LIMITS.question))
        .filter(Boolean),
    ),
  ].slice(0, INTERVIEW_LIMITS.questions);
  return clean.length === INTERVIEW_LIMITS.questions ? clean : null;
}

/**
 * Retour pour chaque question répondue, et pour elles seules (US-30 c.3), dans l'ordre des
 * questions ; null s'il en manque un.
 */
export function feedbackFromAi(
  answers: string[],
  ai: AiInterviewFeedback["feedback"],
): InterviewFeedback[] | null {
  const byIndex = new Map(ai.map((item) => [item.index, item]));
  const feedback: InterviewFeedback[] = [];
  for (const [index, answer] of answers.entries()) {
    if (!answer.trim()) continue;
    const item = byIndex.get(index);
    const entry = item && {
      index,
      strengths: clip(item.strengths, INTERVIEW_LIMITS.strengths),
      improvements: clip(item.improvements, INTERVIEW_LIMITS.improvements),
      example: clip(item.example, INTERVIEW_LIMITS.example),
    };
    if (!entry?.strengths || !entry.improvements || !entry.example) return null;
    feedback.push(entry);
  }
  return feedback;
}
