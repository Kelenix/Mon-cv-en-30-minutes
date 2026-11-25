import "server-only";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ARRIVAL_COOKIE,
  decodeArrival,
  REFERRAL_COOKIE,
  referralCode,
  UNKNOWN_ARRIVAL,
} from "./cookies";

// Provenance et parrainage (ADR-052). La provenance ne va que dans des compteurs anonymes : elle
// n'est jamais enregistrée sur le compte. Aucun échec ici ne bloque l'inscription, la création
// du CV ou le paiement.

/** Crédits offerts au parrain et au filleul, au premier CV du filleul. */
export const REFERRAL_CREDITS = 5;
/** Filleuls récompensés au plus par parrain sur 30 jours (au-delà, seul le filleul l'est). */
export const REFERRAL_MONTHLY_CAP = 20;

async function arrival() {
  return (
    decodeArrival((await cookies()).get(ARRIVAL_COOKIE)?.value) ??
    UNKNOWN_ARRIVAL
  );
}

async function recordAcquisition(event: "signup" | "cv") {
  const { channel, source } = await arrival();
  const { error } = await createAdminClient().rpc("record_acquisition", {
    p_channel: channel,
    p_source: source,
    p_event: event,
  });
  if (error) console.error("Provenance non comptée", event, error.code);
}

/** Première connexion d'un compte : inscription comptée, invitation acceptée rattachée. */
export async function onFirstSignIn(userId: string) {
  const store = await cookies();
  const code = referralCode(store.get(REFERRAL_COOKIE)?.value);
  if (code) {
    store.delete(REFERRAL_COOKIE);
    const { error } = await createAdminClient().rpc("attach_referral", {
      p_referee_id: userId,
      p_code: code,
    });
    if (error) console.error("Parrainage non rattaché", error.code);
  }
  await recordAcquisition("signup");
}

/** Nouveau CV créé : compté, et parrainage récompensé s'il s'agit du premier du filleul. */
export async function onCvCreated(userId: string) {
  const { error } = await createAdminClient().rpc("reward_referral", {
    p_referee_id: userId,
    p_credits: REFERRAL_CREDITS,
    p_monthly_cap: REFERRAL_MONTHLY_CAP,
  });
  if (error) console.error("Parrainage non récompensé", error.code);
  await recordAcquisition("cv");
}

/** Provenance gardée le temps du paiement, effacée dès qu'il est compté (webhook Stripe). */
export async function rememberCheckout(sessionId: string) {
  const { channel, source } = await arrival();
  const { error } = await createAdminClient()
    .from("acquisition_checkouts")
    .insert({ stripe_checkout_session_id: sessionId, channel, source });
  if (error) console.error("Provenance du paiement non gardée", error.code);
}
