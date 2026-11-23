import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/core/env";
import type { Database } from "./database.types";

/**
 * Client à privilèges (clé secrète, contourne la RLS) : réservé aux cas d'usage qui écrivent ce
 * que l'utilisateur ne peut pas écrire lui-même, toujours pour l'identifiant vérifié côté serveur
 * (docs/architecture.md §5).
 */
export function createAdminClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
