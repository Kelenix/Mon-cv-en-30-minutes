import type { LegalPlaceholder } from "./types";

export type LegalValues = Partial<Record<LegalPlaceholder, string>>;

const PLACEHOLDER = /\{(\w+)\}/g;

/** Variables dont l'absence est normale : le paragraphe qui les contient est alors retiré. */
const OPTIONAL_PLACEHOLDERS: readonly string[] = ["vatNumber"];

function placeholdersIn(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER)].map((match) => match[1] ?? "");
}

/** Remplace les `{variables}` ; une valeur obligatoire absente est signalée par `missingLabel`. */
export function fillPlaceholders(
  text: string,
  values: LegalValues,
  missingLabel: string,
): string {
  return text.replace(
    PLACEHOLDER,
    (_, name: string) =>
      values[name as LegalPlaceholder] ?? `[${missingLabel}]`,
  );
}

/** Retire les paragraphes qui dépendent d'une valeur facultative absente, puis les complète. */
export function fillParagraphs(
  paragraphs: readonly string[],
  values: LegalValues,
  missingLabel: string,
): string[] {
  return paragraphs
    .filter((paragraph) =>
      placeholdersIn(paragraph).every(
        (name) =>
          !OPTIONAL_PLACEHOLDERS.includes(name) ||
          values[name as LegalPlaceholder] !== undefined,
      ),
    )
    .map((paragraph) => fillPlaceholders(paragraph, values, missingLabel));
}
