import "server-only";
import { cache } from "react";
import { getCurrentUser } from "@/features/auth/session";
import type { BillingInterval, PlanTier } from "@/features/plans/catalog";
import type { ActivePlan } from "@/features/plans/entitlements";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Status = Database["public"]["Enums"]["subscription_status"];

/** États qui ouvrent les droits : essai, actif, et paiement en retard pendant les relances. */
const ENTITLED: ReadonlySet<Status> = new Set([
  "trialing",
  "active",
  "past_due",
]);

export type Subscription = {
  plan: PlanTier;
  interval: BillingInterval;
  status: Status;
  monthlyCredits: number;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  nextCreditGrantAt: string | null;
};

/** Abonnement en cours du compte connecté (lu sous la RLS), ou `null`. */
export const getCurrentSubscription = cache(
  async (): Promise<Subscription | null> => {
    const user = await getCurrentUser();
    if (!user) return null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        "plan, billing_interval, status, monthly_credits, current_period_end, cancel_at_period_end, trial_ends_at, next_credit_grant_at",
      )
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data || !ENTITLED.has(data.status)) return null;

    return {
      plan: data.plan,
      interval: data.billing_interval,
      status: data.status,
      monthlyCredits: data.monthly_credits,
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      trialEndsAt: data.trial_ends_at,
      nextCreditGrantAt: data.next_credit_grant_at,
    };
  },
);

/** Formule du compte connecté (l'essai compte comme Pro). */
export async function getActivePlan(): Promise<ActivePlan> {
  return (await getCurrentSubscription())?.plan ?? null;
}
