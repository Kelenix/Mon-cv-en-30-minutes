import "server-only";
import { cache } from "react";
import { env } from "@/core/env";
import { getCurrentUser } from "@/features/auth/session";
import { getActivePlan } from "@/features/billing/subscription";
import { planEntitlements } from "@/features/plans/entitlements";
import { getOwnProfile } from "@/features/profile/data/profile-repository";
import { createClient } from "@/lib/supabase/server";
import type { AdsConfig } from "./config";

// Qui voit quelles publicités (docs/architecture.md §11, H15, H26) : décidé par le serveur, aucun
// script publicitaire n'est envoyé à un compte qui n'en voit pas.

export type AdsAudience = {
  config: AdsConfig | null;
  /** Bannières et publicités natives (US-33) : sans abonnement ni retrait des publicités. */
  display: boolean;
  /** Vidéo récompensée (US-35, H26) : tout compte sans abonnement, retrait des pubs compris. */
  rewarded: boolean;
  /** Interstitiel unique (US-34) : encore jamais montré à ce compte. */
  interstitial: boolean;
};

/** Réglages publics des annonces ; null si les publicités sont désactivées. */
export function adsConfig(): AdsConfig | null {
  if (env.ADS_MODE === "off") return null;
  return {
    mode: env.ADS_MODE,
    publisherId: env.ADS_PUBLISHER_ID ?? "",
    networkCode: env.ADS_NETWORK_CODE ?? "",
  };
}

export const getAdsAudience = cache(async (): Promise<AdsAudience> => {
  const config = adsConfig();
  if (!config) {
    return { config, display: false, rewarded: false, interstitial: false };
  }
  const user = await getCurrentUser();
  if (!user) {
    return { config, display: true, rewarded: false, interstitial: false };
  }
  const [plan, profile] = await Promise.all([
    getActivePlan(),
    getOwnProfile(await createClient(), user.id),
  ]);
  const display = planEntitlements(plan).ads && !profile.ads_removed_at;
  return {
    config,
    display,
    rewarded: plan === null,
    interstitial: display && !profile.interstitial_shown_at,
  };
});
