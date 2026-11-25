"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import {
  type ActionResult,
  fail,
  ok,
  validationError,
} from "@/core/action-result";
import { env } from "@/core/env";
import { getCurrentUser } from "@/features/auth/session";
import { getActivePlan } from "@/features/billing/subscription";
import { createAdminClient } from "@/lib/supabase/admin";
import { DAILY_REWARDED_CREDITS, hasAccountFormats } from "./config";

// Annonces liées au compte (docs/system-design.md §3) : jeton de vidéo récompensée émis et
// échangé par le serveur (US-35), interstitiel noté comme vu (US-34).

function sqlError(message: string) {
  return message === "RATE_LIMITED" || message === "CONFLICT"
    ? message
    : "INTERNAL";
}

/** Jeton à usage unique, demandé juste avant l'annonce ; refusé à un abonné (H26). */
export async function issueRewardToken(): Promise<
  ActionResult<{ token: string }>
> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");
  if (!hasAccountFormats(env.ADS_MODE) || (await getActivePlan()) !== null) {
    return fail("FORBIDDEN");
  }
  const { data, error } = await createAdminClient().rpc("issue_reward_token", {
    p_user_id: user.id,
    p_daily_limit: DAILY_REWARDED_CREDITS,
  });
  if (error) return fail(sqlError(error.message));
  return ok({ token: data });
}

/** Annonce vue jusqu'au bout : 1 crédit acheté, une seule fois par jeton (US-35 c.2, c.3). */
export async function redeemRewardToken(
  input: unknown,
): Promise<ActionResult<{ purchasedBalance: number }>> {
  const parsed = z.object({ token: z.uuid() }).safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");

  const { data, error } = await createAdminClient().rpc("redeem_reward_token", {
    p_user_id: user.id,
    p_token: parsed.data.token,
    p_daily_limit: DAILY_REWARDED_CREDITS,
  });
  if (error) return fail(sqlError(error.message));
  // Solde de l'en-tête relu.
  refresh();
  return ok({ purchasedBalance: data });
}

/** L'interstitiel ne s'affiche qu'une fois par compte (US-34 c.1). */
export async function markInterstitialShown(): Promise<
  ActionResult<{ shown: true }>
> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED");
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ interstitial_shown_at: new Date().toISOString() })
    .eq("id", user.id)
    .is("interstitial_shown_at", null);
  if (error) return fail("INTERNAL");
  return ok({ shown: true });
}
