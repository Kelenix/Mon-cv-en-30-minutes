import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { notFound } from "next/navigation";
import { locale as getRootLocale } from "next/root-params";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { env } from "@/core/env";
import { routing } from "@/i18n/routing";
import "../globals.css";

// Poppins servie par le site (aucune requête vers Google à l'exécution), caractères des 5 langues.
const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: {
      default: t("metadata.title"),
      template: `%s · ${t("brand.name")}`,
    },
    description: t("metadata.description"),
  };
}

export default async function LocaleLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const locale = await getRootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations("a11y");

  return (
    <html lang={locale} className={poppins.variable}>
      <body className="flex min-h-dvh flex-col antialiased">
        <NextIntlClientProvider>
          <a
            href="#contenu"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            {t("skipToContent")}
          </a>
          <SiteHeader />
          <main id="contenu" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
