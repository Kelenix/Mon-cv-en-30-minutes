import "server-only";
import { hasLocale } from "next-intl";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { afterSignInPath } from "./after-sign-in";
import { localeOfPath, localizedPath, safeNextPath } from "./paths";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Fin des retours de connexion (/auth/callback pour Google, /auth/confirm pour le lien de
 * l'e-mail) : ouvre la session puis redirige, ou revient à la connexion avec une erreur.
 */
export async function finishSignIn(
  request: NextRequest,
  errorKey: "google" | "lien",
  openSession: (supabase: SupabaseServerClient) => Promise<{ error: unknown }>,
) {
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const preferred = request.cookies.get("NEXT_LOCALE")?.value;
  const locale =
    localeOfPath(next ?? "") ??
    (hasLocale(routing.locales, preferred) ? preferred : routing.defaultLocale);

  const supabase = await createClient();
  const { error } = await openSession(supabase);
  const path = error
    ? `${localizedPath(locale, "/connexion")}?erreur=${errorKey}`
    : await afterSignInPath(supabase, locale, next);

  // Redirection relative : derrière le proxy, `request.url` porte l'adresse interne du conteneur
  // (https://0.0.0.0:3000) ; le navigateur complète le chemin avec l'adresse publique.
  return new NextResponse(null, { status: 307, headers: { Location: path } });
}
