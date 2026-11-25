import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { GUIDE_CATEGORIES, guidesFor } from "@/features/guides/catalog";
import { guidesIndexMetadata } from "@/features/guides/metadata";
import { GuideCta } from "@/features/guides/presentation/guide-cta";
import { getPathname, Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  return guidesIndexMetadata((await getLocale()) as AppLocale);
}

// Rubrique « Conseils » (ADR-052) : articles par rubrique. Une langue sans article ramène à
// l'accueil.
export default async function GuidesPage() {
  const locale = (await getLocale()) as AppLocale;
  const guides = guidesFor(locale);
  if (guides.length === 0) redirect(getPathname({ locale, href: "/" }));
  const t = await getTranslations("guides");

  return (
    <div className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="grid min-w-0 gap-10">
        <header className="grid gap-4">
          <h1 className="text-[2rem] leading-[1.15] font-bold md:text-5xl">
            {t("title")}
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            {t("intro")}
          </p>
        </header>
        {GUIDE_CATEGORIES.map((category) => {
          const items = guides.filter((guide) => guide.category === category);
          if (items.length === 0) return null;
          return (
            <section
              key={category}
              aria-labelledby={`rubrique-${category}`}
              className="grid gap-5"
            >
              <h2
                id={`rubrique-${category}`}
                className="text-2xl leading-tight font-bold md:text-3xl"
              >
                {t(`categories.${category}`)}
              </h2>
              <ul className="grid gap-4 md:grid-cols-2">
                {items.map((guide) => (
                  <li key={guide.slug}>
                    <Link
                      href={{
                        pathname: "/conseils/[slug]",
                        params: { slug: guide.slug },
                      }}
                      className="grid h-full gap-2 rounded-2xl border border-border p-5 transition-colors hover:border-primary hover:bg-surface"
                    >
                      <span className="text-lg font-semibold text-primary-strong">
                        {guide.h1}
                      </span>
                      <span className="text-muted-foreground">
                        {guide.description}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <GuideCta kind="cv" className="lg:sticky lg:top-6" />
    </div>
  );
}
