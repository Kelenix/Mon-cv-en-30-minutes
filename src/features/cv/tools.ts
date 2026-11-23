import type { AiAdaptation } from "@/features/ai/cv-tools-writer";
import { clip } from "./content";
import { CV_LIMITS, type CvContent, type CvExperience } from "./schemas";

// Résultats des outils IA ramenés au contenu du CV (US-25 à US-27) : limites appliquées et,
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
