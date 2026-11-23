import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { env } from "@/core/env";
import { supabaseCookieOptions } from "./cookie-options";
import type { Database } from "./database.types";

/**
 * Client Supabase de l'utilisateur courant (session lue dans les cookies), soumis à la RLS.
 * Un nouveau client par requête.
 */
export async function createClient() {
  // Données propres à chaque requête : jamais pré-rendues ni préchargées (le client Supabase lit
  // l'heure courante pour vérifier l'expiration de la session).
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: supabaseCookieOptions,
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Rendu d'un Server Component : écriture impossible, le proxy rafraîchit la session.
          }
        },
      },
    },
  );
}
