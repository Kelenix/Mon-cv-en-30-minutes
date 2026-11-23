import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { AppLocale, AppPathname } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { localizedPath, withNext } from "./paths";

export type CurrentUser = {
  id: string;
  email: string;
  /** Métadonnées du compte (prénom et nom fournis par Google, langue des e-mails). */
  metadata: Record<string, unknown>;
};

/** Compte connecté, d'après le jeton de session vérifié ; lu une seule fois par requête. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;
  const { sub, email, user_metadata } = data.claims;
  return { id: sub, email: email ?? "", metadata: user_metadata ?? {} };
});

export async function getCurrentUserId() {
  return (await getCurrentUser())?.id ?? null;
}

/**
 * Garde des pages privées : renvoie vers la connexion si la session manque (le proxy le fait
 * déjà ; ceci est la seconde barrière) et enregistre l'activité du compte (rétention, US-40).
 */
export async function requireUser(locale: AppLocale, pathname: AppPathname) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      withNext(
        localizedPath(locale, "/connexion"),
        localizedPath(locale, pathname),
      ),
    );
  }
  const supabase = await createClient();
  await supabase.rpc("touch_last_seen");
  return user;
}
