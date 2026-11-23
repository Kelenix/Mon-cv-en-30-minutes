import { hasLocale } from "next-intl";
import { type AppLocale, type AppPathname, routing } from "@/i18n/routing";

// Chemins utiles à la connexion, sans dépendance à Next.js : utilisables dans le proxy, les
// actions et les routes de retour, et testés unitairement.

/** Pages réservées aux comptes connectés (sous-chemins compris). */
export const PRIVATE_PATHNAMES = [
  "/compte",
  "/bienvenue",
] as const satisfies readonly AppPathname[];

/** Adresse publique d'une page dans une langue (ex. `/en/account`). */
export function localizedPath(locale: AppLocale, pathname: AppPathname) {
  const entry = routing.pathnames[pathname];
  const localized = typeof entry === "string" ? entry : entry[locale];
  return localized === "/" ? `/${locale}` : `/${locale}${localized}`;
}

/** Ajoute `?next=…` à une adresse interne. */
export function withNext(path: string, next: string) {
  return `${path}?${new URLSearchParams({ next })}`;
}

/** Langue indiquée par le premier segment d'une adresse. */
export function localeOfPath(path: string): AppLocale | undefined {
  const segment = path.split("/")[1];
  return hasLocale(routing.locales, segment) ? segment : undefined;
}

function matches(path: string, pathname: AppPathname) {
  return routing.locales.some((locale) => {
    const base = localizedPath(locale, pathname);
    return path === base || path.startsWith(`${base}/`);
  });
}

export function isPrivatePath(path: string) {
  return PRIVATE_PATHNAMES.some((pathname) => matches(path, pathname));
}

export function isSignInPath(path: string) {
  return matches(path, "/connexion");
}

/**
 * Destination après connexion : uniquement une adresse interne au site (aucune redirection
 * ouverte vers un autre domaine, docs/system-design.md §3).
 */
export function safeNextPath(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 512) return undefined;
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return undefined;
  }
  const base = "http://site.invalid";
  const url = new URL(value, base);
  return url.origin === base ? `${url.pathname}${url.search}` : undefined;
}
