import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { pageMetadata, type StaticPathname } from "@/i18n/metadata";
import { LEGAL_CONTENT } from "../content";
import { fillParagraphs, fillPlaceholders } from "../interpolate";
import { legalValues } from "../legal-values";
import type { LegalPage } from "../types";

export async function legalPageMetadata(
  page: LegalPage,
  pathname: StaticPathname,
): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("brand");
  const document = LEGAL_CONTENT[locale].pages[page];

  return pageMetadata({
    pathname,
    title: document.title,
    description: fillPlaceholders(
      document.description,
      { brandName: t("name") },
      "",
    ),
  });
}

// Pages légales (US-38) : texte de la langue affichée, informations du vendeur insérées ; en
// pleine largeur, sommaire fixe à gauche sur ordinateur.
export async function LegalPageView({ page }: { page: LegalPage }) {
  const locale = await getLocale();
  const t = await getTranslations();
  const format = await getFormatter();
  const content = LEGAL_CONTENT[locale];
  const document = content.pages[page];
  const values = legalValues(t("brand.name"));
  const missingLabel = t("legal.missing");

  return (
    <article className="container-page py-12 md:py-16">
      <h1 className="text-3xl font-bold md:text-4xl">{document.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("legal.updatedAt", {
          date: format.dateTime(new Date(content.updatedAt), {
            dateStyle: "long",
          }),
        })}
      </p>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-12">
        <nav
          aria-labelledby="sommaire"
          className="rounded-xl bg-surface p-5 lg:sticky lg:top-24 lg:max-h-[calc(100svh-8rem)] lg:overflow-y-auto"
        >
          <h2 id="sommaire" className="font-semibold">
            {t("legal.tableOfContents")}
          </h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5">
            {document.sections.map((section, index) => (
              <li key={section.title}>
                <a
                  href={`#section-${index + 1}`}
                  className="text-primary-strong underline-offset-4 hover:underline"
                >
                  {fillPlaceholders(section.title, values, missingLabel)}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div>
          {document.sections.map((section, index) => (
            <section
              key={section.title}
              id={`section-${index + 1}`}
              className="mt-10 scroll-mt-24 first:mt-0"
            >
              <h2 className="text-xl font-semibold">
                {fillPlaceholders(section.title, values, missingLabel)}
              </h2>
              {fillParagraphs(section.paragraphs, values, missingLabel).map(
                (paragraph) => (
                  <p key={paragraph} className="mt-3 leading-relaxed">
                    {paragraph}
                  </p>
                ),
              )}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
