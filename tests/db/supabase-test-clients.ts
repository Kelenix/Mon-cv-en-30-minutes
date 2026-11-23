import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Clients de test pour Supabase local : variables lues dans `.env.local` en développement,
// fournies par `supabase status` en CI.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

function required(name: string) {
  const value = process.env[name];
  if (!value)
    throw new Error(`${name} manquante : lancer \`npm run db:start\`.`);
  return value;
}

const url = required("NEXT_PUBLIC_SUPABASE_URL");
const publishableKey = required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const secretKey = required("SUPABASE_SECRET_KEY");
const options = { auth: { persistSession: false, autoRefreshToken: false } };

export const admin = createClient<Database>(url, secretKey, options);

export function anonymousClient() {
  return createClient<Database>(url, publishableKey, options);
}

export function testEmail(label: string) {
  return `db-${label}-${randomUUID()}@exemple.test`;
}

/** Crée un compte (sans e-mail envoyé) et renvoie un client connecté en son nom. */
export async function createSignedInUser(
  email: string,
  metadata: Record<string, unknown> = {},
) {
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: metadata,
    });
  if (createError) throw createError;

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError) throw linkError;

  const client = anonymousClient();
  const { error } = await client.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: "email",
  });
  if (error) throw error;

  return { id: created.user.id, client };
}
