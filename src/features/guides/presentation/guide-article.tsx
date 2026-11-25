import { LightbulbIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { StructuredData } from "@/components/seo/structured-data";
import { env } from "@/core/env";
import { getPathname, Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { guideBySlug, headingId } from "../catalog";
import type { Guide, GuideBlock } from "../types";
import { GuideCta } from "./guide-cta";
import { GuideExample } from "./guide-example";

function Block({ block }: { block: GuideBlock }) {
  const t = useTranslations("guides");
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List
          className={
            block.ordered
              ? "grid list-decimal gap-2 pl-6"
              : "grid list-disc gap-2 pl-6"
          }
        >
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </List>
      );
    }
    case "example":
      return <GuideExample title={block.title} text={block.text} />;
    case "tip":
      return (
        <aside className="flex gap-3 rounded-xl bg-surface p-4">
          <LightbulbIcon
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-primary"
          />
          <p>
            <span className="font-semibold">{t("tip")} : </span>
            {block.text}
          </p>
        </aside>
      );
  }
}

/** Données structurées : article, questions fréquentes et fil d'Ariane (schema.org). */
function guideData(
  guide: Guide,
  locale: AppLocale,
  brand: string,
  labels: {
    home: string;
    guides: string;
  },
) {
  const url = (path: string) => `${env.NEXT_PUBLIC_SITE_URL}${path}`;
  const page = url(
    getPathname({
      locale,
      href: { pathname: "/conseils/[slug]", params: { slug: guide.slug } },
    }),
  );
  const organization = {
    "@type": "Organization",
    name: brand,
    url: url(getPathname({ locale, href: "/" })),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.h1,
        description: guide.description,
        inLanguage: locale,
        datePublished: guide.updated,
        dateModified: guide.updated,
        mainEntityOfPage: page,
        author: organization,
        publisher: organization,
      },
      {
        "@type": "FAQPage",
        mainEntity: guide.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          [labels.home, url(getPathname({ locale, href: "/" }))],
          [labels.guides, url(getPathname({ locale, href: "/conseils" }))],
          [guide.h1, page],
        ].map(([name, item], index) => ({
          "@type": "ListItem",
          position: index + 1,
          name,
          item,
        })),
      },
    ],
  };
}

/**
 * Article de la rubrique « Conseils » : texte à gauche, et à droite l'appel à l'action, le
 * sommaire et les articles liés (pleine largeur, deux colonnes sur ordinateur).
 */
export function GuideArticle({ guide }: { guide: Guide }) {
  const t = useTranslations("guides");
  const tBrand = useTranslations("brand");
  const format = useFormatter();
  const locale = useLocale();
  const related = guide.related
    .map((slug) => guideBySlug(locale, slug))
    .filter((item) => item !== null);
  const faqHeading = t("faq");

  return (
    <div className="container-page py-10 md:py-14">
      <nav aria-label={t("breadcrumb")} className="text-sm">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
          <li>
            <Link href="/" className="underline-offset-4 hover:underline">
              {t("home")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href="/conseils"
              className="underline-offset-4 hover:underline"
            >
              {t("nav")}
            </Link>
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <article className="min-w-0">
          <header className="grid gap-4">
            <h1 className="text-[2rem] leading-[1.15] font-bold md:text-5xl">
              {guide.h1}
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              {guide.intro}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("updated", {
                date: format.dateTime(new Date(guide.updated), {
                  dateStyle: "long",
                }),
              })}
            </p>
          </header>

          <GuideCta kind={guide.cta} className="mt-8 lg:hidden" />

          <div className="mt-10 grid gap-12 text-[1.0625rem] leading-relaxed">
            {guide.sections.map((section) => (
              <section
                key={section.heading}
                aria-labelledby={headingId(section.heading)}
                className="grid gap-5"
              >
                <h2
                  id={headingId(section.heading)}
                  className="scroll-mt-24 text-2xl leading-tight font-bold md:text-3xl"
                >
                  {section.heading}
                </h2>
                {section.blocks.map((block, index) => (
                  <Block key={index} block={block} />
                ))}
              </section>
            ))}

            <section aria-labelledby="questions" className="grid gap-5">
              <h2
                id="questions"
                className="scroll-mt-24 text-2xl leading-tight font-bold md:text-3xl"
              >
                {faqHeading}
              </h2>
              <div className="grid gap-6">
                {guide.faq.map((item) => (
                  <div key={item.question} className="grid gap-1">
                    <h3 className="text-lg font-semibold">{item.question}</h3>
                    <p>{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </article>

        <aside className="grid gap-6 lg:sticky lg:top-6">
          <GuideCta kind={guide.cta} />
          <nav
            aria-label={t("toc")}
            className="hidden rounded-2xl border border-border p-5 lg:block"
          >
            <p className="font-semibold">{t("toc")}</p>
            <ol className="mt-3 grid gap-1 text-sm">
              {[...guide.sections.map((s) => s.heading), faqHeading].map(
                (heading) => (
                  <li key={heading}>
                    <a
                      href={`#${heading === faqHeading ? "questions" : headingId(heading)}`}
                      className="inline-flex min-h-9 items-center underline-offset-4 hover:underline"
                    >
                      {heading}
                    </a>
                  </li>
                ),
              )}
            </ol>
          </nav>
          {related.length > 0 ? (
            <nav
              aria-label={t("related")}
              className="rounded-2xl border border-border p-5"
            >
              <p className="font-semibold">{t("related")}</p>
              <ul className="mt-3 grid gap-2">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={{
                        pathname: "/conseils/[slug]",
                        params: { slug: item.slug },
                      }}
                      className="inline-flex min-h-11 items-center text-primary-strong underline-offset-4 hover:underline"
                    >
                      {item.h1}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </aside>
      </div>
      <StructuredData
        data={guideData(guide, locale, tBrand("name"), {
          home: t("home"),
          guides: t("nav"),
        })}
      />
    </div>
  );
}
