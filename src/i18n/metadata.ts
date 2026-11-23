import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getPathname } from "./navigation";
import { type AppPathname, routing } from "./routing";

/** Pages sans paramètre (les pages publiques référencées). */
export type StaticPathname = Exclude<AppPathname, `${string}[${string}`>;

type PageMetadataInput = {
  pathname: StaticPathname;
  /** Titre de la page ; absent pour l'accueil, qui garde le titre complet du site. */
  title?: string;
  description: string;
};

/** Titre, description, adresse canonique et versions dans les autres langues (hreflang). */
export async function pageMetadata({
  pathname,
  title,
  description,
}: PageMetadataInput): Promise<Metadata> {
  const locale = await getLocale();
  const languages = Object.fromEntries(
    routing.locales.map((language) => [
      language,
      getPathname({ locale: language, href: pathname }),
    ]),
  );

  return {
    ...(title ? { title } : {}),
    description,
    alternates: {
      canonical: getPathname({ locale, href: pathname }),
      languages: {
        ...languages,
        "x-default": getPathname({
          locale: routing.defaultLocale,
          href: pathname,
        }),
      },
    },
  };
}
