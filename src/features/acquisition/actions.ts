"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { localizedPath } from "@/features/auth/paths";
import { localeSchema } from "@/i18n/locale-schema";
import { supabaseCookieOptions } from "@/lib/supabase/cookie-options";
import {
  ACQUISITION_COOKIE_MAX_AGE,
  REFERRAL_COOKIE,
  referralCode,
} from "./cookies";
import { invitationExists } from "./referrals";

/**
 * Invitation acceptée (ADR-052) : gardée 30 jours, le temps de créer le compte, puis direction la
 * création du CV. Un code inconnu mène à la création sans rien garder.
 */
export async function acceptInvitation(formData: FormData) {
  const parsedLocale = localeSchema.safeParse(formData.get("locale"));
  const locale = parsedLocale.success ? parsedLocale.data : "fr";
  const code = referralCode(formData.get("code"));
  if (code && (await invitationExists(code))) {
    (await cookies()).set(REFERRAL_COOKIE, code, {
      ...supabaseCookieOptions,
      maxAge: ACQUISITION_COOKIE_MAX_AGE,
      path: "/",
    });
  }
  redirect(localizedPath(locale, "/creer"));
}
