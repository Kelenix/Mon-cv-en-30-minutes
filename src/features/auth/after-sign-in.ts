import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppLocale } from "@/i18n/routing";
import { countryOf } from "@/lib/geo";
import { clientIp } from "@/lib/ip-hash";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { localizedPath, safeNextPath, withNext } from "./paths";

/**
 * Destination après connexion : l'étape « Comment t'appelles-tu ? » tant que le nom manque
 * (première connexion, US-04 c.2), sinon la page demandée ou l'espace compte. À la première
 * connexion, le pays est déduit de l'adresse IP pour les statistiques (ADR-040) ; l'adresse
 * n'est pas gardée.
 */
export async function afterSignInPath(
  supabase: SupabaseClient<Database>,
  locale: AppLocale,
  next: unknown,
) {
  const destination = safeNextPath(next) ?? localizedPath(locale, "/compte");
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, signup_country")
    .maybeSingle();

  if (profile && !profile.signup_country) {
    const country = countryOf(await clientIp());
    if (country) {
      await createAdminClient()
        .from("profiles")
        .update({ signup_country: country })
        .eq("id", profile.id)
        .is("signup_country", null);
    }
  }

  return profile?.first_name
    ? destination
    : withNext(localizedPath(locale, "/bienvenue"), destination);
}
