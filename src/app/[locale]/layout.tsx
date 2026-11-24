import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { notFound } from "next/navigation";
import { locale as getRootLocale } from "next/root-params";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ViewTransition } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { env } from "@/core/env";
import { adsConfig } from "@/features/ads/audience";
import {
  ManageCookiesButton,
  SimulatedConsentBanner,
} from "@/features/ads/presentation/consent";
import { pickClientMessages } from "@/i18n/client-messages";
import { NAV_TRANSITION } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

// Traductions des composants client communs à toutes les pages (en-tête, page d'erreur).
const CLIENT_NAMESPACES = [
  "locales",
  "languageSwitcher",
  "error",
  "ads",
] as const;

// Poppins servie par le site (aucune requête vers Google à l'exécution). Seul le sous-ensemble
// « latin », qui couvre les 5 langues (accents, œ, €, espaces fines), est préchargé ; les autres
// restent déclarés et ne sont téléchargés que si un caractère les demande.
const poppins = Poppins({
  subsets: ["latin"],
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
  const clientMessages = await pickClientMessages(CLIENT_NAMESPACES);
  const ads = adsConfig();

  return (
    <html lang={locale} className={poppins.variable}>
      <body className="flex min-h-dvh flex-col antialiased">
        <NextIntlClientProvider messages={clientMessages}>
          <a
            href="#contenu"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            {t("skipToContent")}
          </a>
          <SiteHeader />
          {/* Fondu du contenu entre deux pages (navigations marquées « nav » seulement : les
              actions dans une page ne s'animent pas) ; l'en-tête reste immobile
              (docs/design/design-system.md §5). */}
          <ViewTransition
            update={{ [NAV_TRANSITION]: "page", default: "none" }}
            default="none"
          >
            <main id="contenu" className="flex-1">
              {children}
            </main>
          </ViewTransition>
          <SiteFooter
            cookieChoices={ads ? <ManageCookiesButton config={ads} /> : null}
          />
          {ads?.mode === "simulation" ? <SimulatedConsentBanner /> : null}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
