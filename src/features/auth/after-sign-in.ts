import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppLocale } from "@/i18n/routing";
import type { Database } from "@/lib/supabase/database.types";
import { localizedPath, safeNextPath, withNext } from "./paths";

/**
 * Destination après connexion : l'étape « Comment t'appelles-tu ? » tant que le nom manque
 * (première connexion, US-04 c.2), sinon la page demandée ou l'espace compte.
 */
export async function afterSignInPath(
  supabase: SupabaseClient<Database>,
  locale: AppLocale,
  next: unknown,
) {
  const destination = safeNextPath(next) ?? localizedPath(locale, "/compte");
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .maybeSingle();

  return profile?.first_name
    ? destination
    : withNext(localizedPath(locale, "/bienvenue"), destination);
}
