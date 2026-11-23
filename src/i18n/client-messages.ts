import "server-only";
import type { Messages } from "next-intl";
import { getMessages } from "next-intl/server";

/**
 * Sous-ensemble des traductions envoyé au navigateur : seuls les espaces utilisés par les
 * composants client de la page ; le reste est rendu côté serveur.
 */
export async function pickClientMessages(
  namespaces: readonly (keyof Messages)[],
) {
  const messages = await getMessages();
  return Object.fromEntries(
    namespaces.map((namespace) => [namespace, messages[namespace]]),
  );
}
