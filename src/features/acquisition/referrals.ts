import "server-only";
import { env } from "@/core/env";
import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { REFERRAL_CREDITS } from "./server";

export type ReferralSummary = {
  /** Lien d'invitation personnel, suivi comme campagne « parrainage ». */
  link: string;
  /** Comptes créés avec le lien. */
  invited: number;
  /** Crédits gagnés par le parrain. */
  creditsEarned: number;
};

/** Adresse d'une invitation dans la langue donnée. */
export function invitationUrl(locale: AppLocale, code: string) {
  const path = getPathname({
    locale,
    href: { pathname: "/invitation/[code]", params: { code } },
  });
  return `${env.NEXT_PUBLIC_SITE_URL}${path}?utm_source=parrainage`;
}

/** Lien et résultats du parrainage du compte connecté ; le code est créé à la première demande. */
export async function getOwnReferral(
  userId: string,
  locale: AppLocale,
): Promise<ReferralSummary | null> {
  const { data: code, error } = await createAdminClient().rpc(
    "ensure_referral_code",
    { p_user_id: userId },
  );
  if (error || !code) {
    console.error("Code de parrainage indisponible", error?.code);
    return null;
  }
  const { data: referrals } = await (
    await createClient()
  )
    .from("referrals")
    .select("referrer_rewarded")
    .eq("referrer_id", userId);
  return {
    link: invitationUrl(locale, code),
    invited: referrals?.length ?? 0,
    creditsEarned:
      (referrals ?? []).filter((row) => row.referrer_rewarded).length *
      REFERRAL_CREDITS,
  };
}

/** L'invitation existe-t-elle ? (le parrain n'est pas révélé) */
export async function invitationExists(code: string) {
  const { data } = await createAdminClient()
    .from("profiles")
    .select("id")
    .eq("referral_code", code)
    .maybeSingle();
  return Boolean(data);
}
