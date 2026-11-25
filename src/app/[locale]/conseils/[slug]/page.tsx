import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { allGuideSlugs, guideBySlug } from "@/features/guides/catalog";
import { guideMetadata } from "@/features/guides/metadata";
import { GuideArticle } from "@/features/guides/presentation/guide-article";
import { pickClientMessages } from "@/i18n/client-messages";
import { getPathname } from "@/i18n/navigation";
import { type AppLocale, routing } from "@/i18n/routing";

// Article de la rubrique « Conseils » (ADR-052), généré à la compilation. Un article absent dans
// cette langue (changement de langue) ramène à l'accueil.
export function generateStaticParams() {
  return allGuideSlugs().map((slug) => ({ slug }));
}

async function resolve(
  params: PageProps<"/[locale]/conseils/[slug]">["params"],
) {
  const { locale, slug } = await params;
  const appLocale: AppLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  return { locale: appLocale, guide: guideBySlug(appLocale, slug) };
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/conseils/[slug]">): Promise<Metadata> {
  const { locale, guide } = await resolve(params);
  if (!guide) return { robots: { index: false } };
  return guideMetadata(locale, guide);
}

export default async function GuidePage({
  params,
}: PageProps<"/[locale]/conseils/[slug]">) {
  const { locale, guide } = await resolve(params);
  if (!guide) redirect(getPathname({ locale, href: "/" }));
  const messages = await pickClientMessages(["guides", "cvEditor"]);
  return (
    <NextIntlClientProvider messages={messages}>
      <GuideArticle guide={guide} />
    </NextIntlClientProvider>
  );
}
