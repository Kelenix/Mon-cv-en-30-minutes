import { createServerClient } from "@supabase/ssr";
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";
import createMiddleware from "next-intl/middleware";
import { env } from "@/core/env";
import { isAdminEmail } from "@/features/admin/admins";
import { recordVisit } from "@/features/admin/record-visit";
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

/** Session Supabase rafraîchie dans les cookies de `response` ; vrai si connecté. */
async function readSession(request: NextRequest, response: NextResponse) {
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
  return data?.claims ?? null;
}

/**
 * Espace d'administration (ADR-040), en français, hors du routage par langue : connexion
 * exigée, puis page introuvable pour qui n'est pas administrateur (son existence n'est pas
 * révélée). Chaque page et chaque action revérifient l'administrateur.
 */
async function adminGate(request: NextRequest) {
  const response = NextResponse.next();
  const claims = await readSession(request, response);
  const { pathname, search } = request.nextUrl;
  if (!claims) {
    return redirectKeepingCookies(
      request,
      response,
      withNext(localizedPath("fr", "/connexion"), `${pathname}${search}`),
    );
  }
  if (!isAdminEmail(claims.email)) {
    const notFound = NextResponse.rewrite(
      new URL("/fr/introuvable", request.url),
    );
    for (const cookie of response.cookies.getAll())
      notFound.cookies.set(cookie);
    return notFound;
  }
  return response;
}

// Rafraîchit la session Supabase et oriente selon l'état de connexion (docs/architecture.md §6).
// Ce n'est pas la seule barrière : chaque page et chaque action privée revérifie l'utilisateur.
export default async function proxy(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const { pathname, search, searchParams } = request.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return adminGate(request);
  }

  const response = handleI18nRouting(request);
  if (response.headers.has("location")) return response;

  // Provenance des visites : comptée après la réponse, sans la retarder.
  event.waitUntil(recordVisit(request).catch(() => undefined));

  const signedIn = Boolean(await readSession(request, response));
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
