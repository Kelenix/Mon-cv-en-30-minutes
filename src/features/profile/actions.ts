"use server";

import { redirect } from "next/navigation";
import {
  type ActionResult,
  fail,
  ok,
  validationError,
} from "@/core/action-result";
import { localizedPath, safeNextPath } from "@/features/auth/paths";
import { getCurrentUserId } from "@/features/auth/session";
import { localeSchema } from "@/i18n/locale-schema";
import type { AppLocale } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { updateOwnProfile } from "./data/profile-repository";
import { deleteAccountSchema, profileSchema, welcomeSchema } from "./schemas";

// Profil et suppression du compte (US-04 c.2, US-05, US-06, US-41 c.2). Chaque action revérifie
// la session ; les écritures passent par le client de l'utilisateur, donc par la RLS.

/** Langue des e-mails de connexion : enregistrée aussi dans les métadonnées du compte. */
async function saveLocale(
  supabase: Awaited<ReturnType<typeof createClient>>,
  locale: AppLocale,
) {
  const { error } = await supabase.auth.updateUser({ data: { locale } });
  if (error) console.error("Langue du compte non enregistrée", error.code);
}

/** Première connexion : prénom et nom (pré-remplis avec Google), puis la page demandée. */
export async function completeProfile(
  formData: FormData,
): Promise<ActionResult<never>> {
  const parsed = welcomeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const { locale, firstName, lastName } = parsed.data;

  const userId = await getCurrentUserId();
  if (!userId) return fail("UNAUTHENTICATED");

  const supabase = await createClient();
  const { error } = await updateOwnProfile(supabase, userId, {
    first_name: firstName,
    last_name: lastName,
    locale,
  });
  if (error) return fail("INTERNAL");
  await saveLocale(supabase, locale);

  redirect(
    safeNextPath(formData.get("next")) ?? localizedPath(locale, "/compte"),
  );
}

export async function updateProfile(
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const { firstName, lastName, phone, city } = parsed.data;

  const userId = await getCurrentUserId();
  if (!userId) return fail("UNAUTHENTICATED");

  const supabase = await createClient();
  const { error } = await updateOwnProfile(supabase, userId, {
    first_name: firstName,
    last_name: lastName,
    phone,
    city,
  });
  return error ? fail("INTERNAL") : ok(null);
}

/** Langue choisie avec le sélecteur : mémorisée dans le profil d'un compte connecté. */
export async function saveLocalePreference(value: string) {
  const parsed = localeSchema.safeParse(value);
  const userId = await getCurrentUserId();
  if (!parsed.success || !userId) return;

  const supabase = await createClient();
  await updateOwnProfile(supabase, userId, { locale: parsed.data });
  await saveLocale(supabase, parsed.data);
}

/**
 * Suppression définitive : le compte d'authentification est supprimé, et avec lui, en cascade,
 * toutes les données de l'utilisateur. La résiliation de l'abonnement Stripe s'ajoute à l'Inc-6.
 */
export async function deleteAccount(
  formData: FormData,
): Promise<ActionResult<never>> {
  const parsed = deleteAccountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const { locale } = parsed.data;

  const userId = await getCurrentUserId();
  if (!userId) return fail("UNAUTHENTICATED");

  const { error } = await createAdminClient().auth.admin.deleteUser(userId);
  if (error) {
    console.error("Suppression du compte impossible", error.code);
    return fail("INTERNAL");
  }

  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect(`${localizedPath(locale, "/")}?compte=supprime`);
}
