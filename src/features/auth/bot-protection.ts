import "server-only";
import { env } from "@/core/env";
import { hashClientIp, saltedHash } from "@/lib/ip-hash";
import { createAdminClient } from "@/lib/supabase/admin";

// Protection contre les robots à la connexion (ADR-039). Plafonds par heure : assez larges pour
// un réseau partagé (bureau, université), assez bas pour arrêter un envoi massif d'e-mails ou un
// essai de tous les codes (10 essais par heure pour 1 million de codes possibles).
const WINDOW_SECONDS = 3600;
const CODE_REQUESTS_PER_IP = 10;
const CODE_ATTEMPTS_PER_IP = 30;
const CODE_ATTEMPTS_PER_EMAIL = 10;

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Compte une demande ; si la base ne répond pas, la connexion échouera de toute façon plus loin. */
async function consume(key: string, limit: number) {
  const { data, error } = await createAdminClient().rpc("consume_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: WINDOW_SECONDS,
  });
  if (error) console.error("Plafond de connexion indisponible", error.code);
  return error ? true : data;
}

/** Demande d'un code par e-mail : plafond par adresse IP. */
export async function allowCodeRequest() {
  const ip = await hashClientIp();
  return !ip || consume(`otp-send:${ip}`, CODE_REQUESTS_PER_IP);
}

/** Essai d'un code : plafonds par adresse IP et par adresse e-mail. */
export async function allowCodeAttempt(email: string) {
  const ip = await hashClientIp();
  if (ip && !(await consume(`otp-verify:${ip}`, CODE_ATTEMPTS_PER_IP))) {
    return false;
  }
  const account = saltedHash(email);
  return (
    !account || consume(`otp-verify-email:${account}`, CODE_ATTEMPTS_PER_EMAIL)
  );
}

/**
 * Jeton Cloudflare Turnstile du formulaire, vérifié auprès de Cloudflare (usage unique). Sans
 * clé (développement et tests), la vérification est désactivée ; elle est exigée en production.
 */
export async function verifyHuman(token: FormDataEntryValue | null) {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
      signal: AbortSignal.timeout(5000),
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error(
      "Vérification anti-robot impossible",
      (error as Error).message,
    );
    return false;
  }
}
