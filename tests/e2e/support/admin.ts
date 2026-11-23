import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Accès administrateur à Supabase local pour préparer des données de test (crédits, etc.) :
// variables lues dans `.env.local` en développement, fournies par la CI sinon.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SECRET_KEY ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export async function userIdByEmail(email: string) {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((candidate) => candidate.email === email);
  if (!user) throw new Error(`Compte introuvable : ${email}`);
  return user.id;
}

/** Débloque un CV en CV Pro (sans passer par un achat). */
export async function unlockCvPro(cvId: string) {
  const { error } = await admin
    .from("cvs")
    .update({ pro_unlocked_at: new Date().toISOString() })
    .eq("id", cvId);
  if (error) throw error;
}

/** Abonnement actif ou à l'essai, tel que l'enregistre le webhook Stripe (Inc-6). */
export async function activateSubscription(
  email: string,
  plan: "essential" | "pro" | "premium",
  status: "active" | "trialing" = "active",
) {
  const quota = { essential: 20, pro: 60, premium: 150 }[plan];
  const { error } = await admin.rpc("sync_subscription", {
    p_user_id: await userIdByEmail(email),
    p_provider_subscription_id: `sub_e2e_${crypto.randomUUID()}`,
    p_plan: plan,
    p_interval: "month",
    p_status: status,
    p_monthly_credits: quota,
    p_trial_credits: 10,
    p_current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    p_cancel_at_period_end: false,
  });
  if (error) throw error;
}

/** Achat confirmé par Stripe pour une session de paiement donnée (Inc-6). */
export async function fulfillPack(email: string, sessionId: string) {
  const { error } = await admin.rpc("fulfill_purchase", {
    p_user_id: await userIdByEmail(email),
    p_product: "credits_15",
    p_session_id: sessionId,
    p_amount_cents: 699,
    p_currency: "eur",
    p_terms_accepted_at: new Date().toISOString(),
    p_credits: 15,
  });
  if (error) throw error;
}

/** Ajoute des crédits achetés (sans passer par un achat). */
export async function grantPurchasedCredits(email: string, amount: number) {
  const { error } = await admin.rpc("grant_credits", {
    p_user_id: await userIdByEmail(email),
    p_bucket: "purchased",
    p_amount: amount,
    p_reason: "pack_purchase",
  });
  if (error) throw error;
}

/** CV posés directement en base (sans génération), du plus ancien au plus récent. */
export async function createCvs(email: string, titles: string[]) {
  const userId = await userIdByEmail(email);
  const { error } = await admin.from("cvs").insert(
    titles.map((title, index) => ({
      user_id: userId,
      title,
      language: "fr",
      answers: {},
      content: {
        header: { fullName: "Awa Diallo", title },
        summary: "",
        experiences: [],
        skills: [],
        education: [],
        languages: [],
      },
      updated_at: new Date(
        Date.now() - (titles.length - index) * 60_000,
      ).toISOString(),
    })),
  );
  if (error) throw error;
}
