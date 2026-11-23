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

/** Ajoute des crédits achetés, comme le fera un achat de pack (Inc-6). */
export async function grantPurchasedCredits(email: string, amount: number) {
  const { error } = await admin.rpc("grant_credits", {
    p_user_id: await userIdByEmail(email),
    p_bucket: "purchased",
    p_amount: amount,
    p_reason: "pack_purchase",
  });
  if (error) throw error;
}
