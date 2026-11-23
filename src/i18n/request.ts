import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as getRootLocale } from "next/root-params";
import { routing } from "./routing";

// La langue vient du segment `[locale]` (next/root-params). Les Server Actions et les Route
// Handlers n'ont pas accès aux root params : ils doivent passer la langue explicitement, par
// exemple `getTranslations({ locale, namespace })`.
export default getRequestConfig(async ({ locale: explicitLocale }) => {
  const candidate = explicitLocale ?? (await getRootLocale());
  const locale = hasLocale(routing.locales, candidate)
    ? candidate
    : routing.defaultLocale;

  return {
    locale,
    // Fuseau de référence pour les dates affichées (le service est exploité depuis la France).
    timeZone: "Europe/Paris",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
