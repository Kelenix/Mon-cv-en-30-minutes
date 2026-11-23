import "server-only";
import { cache } from "react";
import { getCurrentUser } from "@/features/auth/session";
import type { ActivePlan, Balances } from "@/features/plans/entitlements";
import { createClient } from "@/lib/supabase/server";

export type Wallet = Balances & { total: number };

/**
 * Formule du compte connecté. Les abonnements arrivent avec les paiements (Inc-6, ADR-026) :
 * aucun compte n'en a d'ici là.
 */
export async function getActivePlan(): Promise<ActivePlan> {
  return null;
}

/**
 * Solde du compte connecté (US-07), lu par le client de l'utilisateur, donc limité à son propre
 * portefeuille par la RLS ; une seule lecture par requête.
 */
export const getCurrentWallet = cache(async (): Promise<Wallet | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_wallets")
    .select("included_balance, purchased_balance")
    .eq("user_id", user.id)
    .single();
  if (error) throw error;

  return {
    included: data.included_balance,
    purchased: data.purchased_balance,
    total: data.included_balance + data.purchased_balance,
  };
});
