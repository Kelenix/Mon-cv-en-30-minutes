import type { MetadataRoute } from "next";
import { env } from "@/core/env";
import { pageLanguages, type StaticPathname } from "@/i18n/metadata";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Sitemap multilingue (US-39 c.1) : les pages publiques dans chaque langue, reliées entre elles.
const PUBLIC_PAGES: { pathname: StaticPathname; priority: number }[] = [
  { pathname: "/", priority: 1 },
  { pathname: "/tarifs", priority: 0.8 },
  { pathname: "/modeles", priority: 0.8 },
  { pathname: "/mentions-legales", priority: 0.2 },
  { pathname: "/cgv", priority: 0.2 },
  { pathname: "/confidentialite", priority: 0.2 },
  { pathname: "/cookies", priority: 0.2 },
];

const absolute = (path: string) => `${env.NEXT_PUBLIC_SITE_URL}${path}`;

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.flatMap(({ pathname, priority }) => {
    const languages = Object.fromEntries(
      Object.entries(pageLanguages(pathname)).map(([language, path]) => [
        language,
        absolute(path),
      ]),
    );
    return routing.locales.map((locale) => ({
      url: absolute(getPathname({ locale, href: pathname })),
      priority,
      alternates: { languages },
    }));
  });
}
