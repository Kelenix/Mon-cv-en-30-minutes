import { getTranslations } from "next-intl/server";
import { env } from "@/core/env";
import { GUIDE_LOCALES, guidesFor } from "@/features/guides/catalog";
import { getPathname } from "@/i18n/navigation";
import { type AppLocale, routing } from "@/i18n/routing";

// llms.txt (ADR-052) : présentation du site pour les assistants IA (ChatGPT, Perplexity, Gemini),
// qui citent de plus en plus les sites dans leurs réponses. Format : https://llmstxt.org.
const url = (path: string) => `${env.NEXT_PUBLIC_SITE_URL}${path}`;

export async function GET() {
  const t = await getTranslations({ locale: "fr" });
  const page = (
    href: Parameters<typeof getPathname>[0]["href"],
    locale: AppLocale = "fr",
  ) => url(getPathname({ locale, href }));

  const lines = [
    `# ${t("brand.name")}`,
    "",
    `> ${t("metadata.description")}`,
    "",
    "Le premier CV est gratuit, sans carte bancaire. L'IA met en forme ce que la personne a dit, sans inventer d'expérience, de diplôme ni de chiffre. Le site existe en français, anglais, italien, espagnol et allemand, avec des modèles de CV adaptés à 44 pays. Outils payants en crédits ou par abonnement : adaptation du CV à une offre, lettre de motivation (la première est offerte), version LinkedIn, simulation d'entretien.",
    "",
    "## Pages principales",
    "",
    `- [Créer un CV](${page("/creer")}) : 5 questions, CV prêt en 30 secondes`,
    `- [Modèles de CV par pays](${page("/modeles")}) : 6 modèles, dont 2 gratuits`,
    `- [Test ATS gratuit](${page("/test-cv-ats")}) : lisibilité d'un CV par les logiciels de recrutement, sans inscription`,
    `- [Tarifs](${page("/tarifs")}) : packs de crédits et abonnements`,
    `- [Conseils](${page("/conseils")}) : exemples de lettres et de CV`,
    "",
    ...GUIDE_LOCALES.flatMap((locale) => [
      `## Conseils (${locale})`,
      "",
      ...guidesFor(locale).map(
        (guide) =>
          `- [${guide.h1}](${page({ pathname: "/conseils/[slug]", params: { slug: guide.slug } }, locale)}) : ${guide.description}`,
      ),
      "",
    ]),
    "## Autres langues",
    "",
    ...routing.locales
      .filter((locale) => locale !== "fr")
      .map((locale) => `- ${locale} : ${page("/", locale)}`),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
