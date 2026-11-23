import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { env } from "@/core/env";
import {
  isPrivatePath,
  isSignInPath,
  localeOfPath,
  localizedPath,
  safeNextPath,
  withNext,
} from "@/features/auth/paths";
import { routing } from "@/i18n/routing";
import { supabaseCookieOptions } from "@/lib/supabase/cookie-options";

// Détection de la langue, préfixe d'adresse et cookie de préférence (ADR-019).
const handleI18nRouting = createMiddleware(routing);

// Rafraîchit la session Supabase et oriente selon l'état de connexion (docs/architecture.md §6).
// Ce n'est pas la seule barrière : chaque page et chaque action privée revérifie l'utilisateur.
export default async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);
  if (response.headers.has("location")) return response;

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: supabaseCookieOptions,
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  const { pathname, search, searchParams } = request.nextUrl;
  const locale = localeOfPath(pathname) ?? routing.defaultLocale;

  if (!signedIn && isPrivatePath(pathname)) {
    return redirectKeepingCookies(
      request,
      response,
      withNext(localizedPath(locale, "/connexion"), `${pathname}${search}`),
    );
  }
  if (signedIn && isSignInPath(pathname)) {
    return redirectKeepingCookies(
      request,
      response,
      safeNextPath(searchParams.get("next")) ??
        localizedPath(locale, "/compte"),
    );
  }
  return response;
}

function redirectKeepingCookies(
  request: NextRequest,
  response: NextResponse,
  path: string,
) {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  // Exclut les routes techniques (API, retour d'authentification, fichiers de Next.js et
  // fichiers statiques comportant un point).
  matcher: ["/((?!api/|auth/|_next/|_vercel/|.*\\..*).*)"],
};
