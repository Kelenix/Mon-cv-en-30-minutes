import type { AiCv } from "@/features/ai/cv-writer";
import { CV_LIMITS, type CvContent } from "./schemas";

// Mise en forme du contenu d'un CV : sortie de l'IA → contenu enregistré, et contenu → texte
// brut copié dans le presse-papiers (US-13). Logique pure, testée unitairement.

/** Coupe un texte trop long à la fin d'un mot (garde-fou : l'IA reçoit déjà les limites). */
export function clip(text: string, max: number) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
}

/** Champ facultatif : absent plutôt que vide. */
function optional(text: string, max: number) {
  return clip(text, max) || undefined;
}

/**
 * Contenu enregistré à partir de la sortie de l'IA : en-tête du compte (H18), limites
 * appliquées, éléments vides retirés, identifiants attribués.
 */
export function buildCvContent(
  generated: AiCv,
  account: { fullName: string; email?: string; phone?: string; city?: string },
  newId: () => string = () => crypto.randomUUID(),
): CvContent {
  return {
    header: {
      fullName: clip(account.fullName, CV_LIMITS.name),
      title: clip(generated.title, CV_LIMITS.title),
      email: optional(account.email ?? "", CV_LIMITS.email),
      phone: optional(account.phone ?? "", CV_LIMITS.phone),
      city: optional(account.city ?? "", CV_LIMITS.city),
    },
    summary: clip(generated.summary, CV_LIMITS.summary),
    experiences: generated.experiences
      .filter((item) => item.role.trim() || item.company.trim())
      .slice(0, CV_LIMITS.experiences)
      .map((item) => ({
        id: newId(),
        role: clip(item.role, CV_LIMITS.role),
        company: clip(item.company, CV_LIMITS.company),
        location: optional(item.location, CV_LIMITS.location),
        startDate: optional(item.startDate, CV_LIMITS.date),
        endDate: optional(item.endDate, CV_LIMITS.date),
        bullets: item.bullets
          .map((bullet) => clip(bullet, CV_LIMITS.bullet))
          .filter(Boolean)
          .slice(0, CV_LIMITS.bullets),
      })),
    skills: generated.skills
      .map((skill) => clip(skill, CV_LIMITS.skill))
      .filter(Boolean)
      .slice(0, CV_LIMITS.skills),
    education: generated.education
      .filter((item) => item.degree.trim() || item.school.trim())
      .slice(0, CV_LIMITS.education)
      .map((item) => ({
        id: newId(),
        degree: clip(item.degree, CV_LIMITS.degree),
        school: clip(item.school, CV_LIMITS.school),
        year: optional(item.year, CV_LIMITS.date),
        details: optional(item.details, CV_LIMITS.details),
      })),
    languages: generated.languages
      .filter((item) => item.name.trim())
      .slice(0, CV_LIMITS.languages)
      .map((item) => ({
        id: newId(),
        name: clip(item.name, CV_LIMITS.language),
        level: optional(item.level, CV_LIMITS.level),
      })),
  };
}

/** Intitulés des rubriques, dans la langue du CV (H34 : intitulés standard). */
export type CvSectionTitles = {
  summary: string;
  experiences: string;
  skills: string;
  education: string;
  languages: string;
};

/** Éléments non vides, joints par un séparateur. */
export function joinFilled(parts: (string | undefined)[], separator: string) {
  return parts.filter((part) => part?.trim()).join(separator);
}

/**
 * Poste et entreprise, diplôme et école : séparés par une virgule. Aucun tiret cadratin ni
 * demi-cadratin dans les CV : ils font « texte écrit par une IA » (demande de l'utilisateur).
 */
export function titleLine(first?: string, second?: string) {
  return joinFilled([first, second], ", ");
}

/** Période d'une expérience (« 2021 - 2024 », « 2021 », « 2024 »). */
export function period(start?: string, end?: string) {
  return start && end ? `${start} - ${end}` : start || end || "";
}

/** Texte brut organisé par rubriques, prêt à coller dans un formulaire de candidature. */
export function cvToPlainText(content: CvContent, titles: CvSectionTitles) {
  const { header } = content;
  const blocks = [
    joinFilled(
      [
        header.fullName,
        header.title,
        joinFilled([header.email, header.phone, header.city], " · "),
      ],
      "\n",
    ),
  ];
  const section = (title: string, body: string) => {
    if (body) blocks.push(`${title.toUpperCase()}\n${body}`);
  };

  section(titles.summary, content.summary);
  section(
    titles.experiences,
    content.experiences
      .map((item) =>
        joinFilled(
          [
            joinFilled(
              [
                titleLine(item.role, item.company),
                item.location,
                period(item.startDate, item.endDate),
              ],
              ", ",
            ),
            ...item.bullets.map((bullet) => `- ${bullet}`),
          ],
          "\n",
        ),
      )
      .join("\n\n"),
  );
  section(titles.skills, content.skills.join(", "));
  section(
    titles.education,
    content.education
      .map((item) =>
        joinFilled(
          [
            joinFilled([titleLine(item.degree, item.school), item.year], ", "),
            item.details,
          ],
          "\n",
        ),
      )
      .join("\n\n"),
  );
  section(
    titles.languages,
    content.languages
      .map((item) => (item.level ? `${item.name} (${item.level})` : item.name))
      .join("\n"),
  );

  return blocks.join("\n\n");
}
