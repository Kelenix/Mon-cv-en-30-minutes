// Textes générés sans tiret cadratin (—) ni demi-cadratin (–) : ils font « texte écrit par une
// IA » (demande de l'utilisateur). La consigne est donnée au modèle et ce nettoyage la garantit.

export const NO_DASH_RULE = `Typography: never use em dashes (—) or en dashes (–). Write separate sentences, or use commas, colons or parentheses; use a plain hyphen (-) for number ranges.`;

const DASH = "[–—]";

/**
 * Remplace les tirets longs d'un texte par la ponctuation qu'écrirait une personne, sans jamais
 * toucher au reste (la virgule de « Madame, Monsieur, » reste).
 */
export function withoutDashes(text: string) {
  return (
    text
      // Intervalle : « 2019–2021 », « 10 — 20 % » → trait d'union.
      .replace(new RegExp(`(\\d)[ \\t]*${DASH}[ \\t]*(\\d)`, "g"), "$1-$2")
      // Tiret en début de ligne (liste) : supprimé.
      .replace(new RegExp(`^[ \\t]*${DASH}[ \\t]*`, "gm"), "")
      // Tiret en fin de ligne ou devant une ponctuation : supprimé.
      .replace(new RegExp(`[ \\t]*${DASH}[ \\t]*(?=$|[.,;:!?)])`, "gm"), "")
      // Incise ou ajout : virgule.
      .replace(new RegExp(`[ \\t]*${DASH}[ \\t]*`, "g"), ", ")
  );
}

/** Applique `withoutDashes` à tous les textes d'une sortie structurée. */
export function deepWithoutDashes<T>(value: T): T {
  if (typeof value === "string") return withoutDashes(value) as T;
  if (Array.isArray(value)) return value.map(deepWithoutDashes) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        deepWithoutDashes(child),
      ]),
    ) as T;
  }
  return value;
}
