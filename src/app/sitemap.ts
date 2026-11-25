import type { MetadataRoute } from "next";
import { env } from "@/core/env";
import { GUIDE_LOCALES, guidesFor } from "@/features/guides/catalog";
import { pageLanguages, type StaticPathname } from "@/i18n/metadata";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Sitemap multilingue (US-39 c.1) : les pages publiques dans chaque langue, reliées entre elles.
const PUBLIC_PAGES: { pathname: StaticPathname; priority: number }[] = [
  { pathname: "/", priority: 1 },
  { pathname: "/tarifs", priority: 0.8 },
  { pathname: "/modeles", priority: 0.8 },
  { pathname: "/test-cv-ats", priority: 0.7 },
  { pathname: "/mentions-legales", priority: 0.2 },
  { pathname: "/cgv", priority: 0.2 },
  { pathname: "/confidentialite", priority: 0.2 },
  { pathname: "/cookies", priority: 0.2 },
];

const absolute = (path: string) => `${env.NEXT_PUBLIC_SITE_URL}${path}`;

/** Rubrique « Conseils » et ses articles, dans les seules langues qui en ont (ADR-052). */
function guidePages(): MetadataRoute.Sitemap {
  return GUIDE_LOCALES.flatMap((locale) => [
    {
      url: absolute(getPathname({ locale, href: "/conseils" })),
      priority: 0.7,
    },
    ...guidesFor(locale).map((guide) => ({
      url: absolute(
        getPathname({
          locale,
          href: { pathname: "/conseils/[slug]", params: { slug: guide.slug } },
        }),
      ),
      lastModified: guide.updated,
      priority: 0.6,
    })),
  ]);
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [...staticPages(), ...guidePages()];
}

function staticPages(): MetadataRoute.Sitemap {
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
