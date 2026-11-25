import type { Visit, VisitChannel } from "@/features/admin/visits";

// Cookies propriétaires du plan d'acquisition (ADR-052) :
// - provenance de la première arrivée, pour des compteurs anonymes (mesure d'audience exemptée) ;
// - invitation acceptée, pour le parrainage demandé par le visiteur.

export const ARRIVAL_COOKIE = "cv30_arrivee";
export const REFERRAL_COOKIE = "cv30_parrain";
export const ACQUISITION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** Visiteur sans cookie de provenance (refusé, effacé ou expiré). */
export const UNKNOWN_ARRIVAL: Visit = { channel: "direct", source: "inconnu" };

const CHANNELS: readonly VisitChannel[] = [
  "direct",
  "search",
  "social",
  "referral",
  "campaign",
];
const SOURCE = /^[a-z0-9._-]{1,60}$/;
const REFERRAL_CODE = /^[a-z0-9]{8}$/;

export function encodeArrival({ channel, source }: Visit) {
  return `${channel}~${source}`;
}

export function decodeArrival(value: string | undefined): Visit | null {
  const parts = (value ?? "").split("~");
  if (parts.length !== 2) return null;
  const [channel, source] = parts as [VisitChannel, string];
  return CHANNELS.includes(channel) && SOURCE.test(source)
    ? { channel, source }
    : null;
}

/** Code de parrainage valide (8 caractères), en minuscules ; `null` sinon. */
export function referralCode(value: unknown) {
  const code = typeof value === "string" ? value.trim().toLowerCase() : "";
  return REFERRAL_CODE.test(code) ? code : null;
}
