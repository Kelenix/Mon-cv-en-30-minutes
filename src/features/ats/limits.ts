import "server-only";
import { hashClientIp } from "@/lib/ip-hash";
import { createAdminClient } from "@/lib/supabase/admin";

/** Taille maximale d'un CV analysé (le serveur web accepte jusqu'à 12 Mo). */
export const ATS_MAX_BYTES = 5 * 1024 * 1024;

/** Analyses par heure et par adresse IP : large pour un usage normal, bloque un envoi en masse. */
const CHECKS_PER_HOUR = 30;

/** Compte une analyse ; si la base ne répond pas, l'analyse reste possible. */
export async function allowAtsCheck() {
  const ip = await hashClientIp();
  if (!ip) return true;
  const { data, error } = await createAdminClient().rpc("consume_rate_limit", {
    p_key: `ats:${ip}`,
    p_limit: CHECKS_PER_HOUR,
    p_window_seconds: 3600,
  });
  if (error) console.error("Plafond du test ATS indisponible", error.code);
  return error ? true : data;
}
