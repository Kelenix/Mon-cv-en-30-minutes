/**
 * Au démarrage du serveur : variables d'environnement validées tout de suite (en production,
 * toutes les clés exigées), pour que le site refuse de démarrer plutôt que d'échouer à la
 * première requête (docs/deployment.md).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("@/core/env");
}
