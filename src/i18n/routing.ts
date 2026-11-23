import { defineRouting } from "next-intl/routing";

// Langues proposées (ADR-018). Le français est la langue de rédaction ; l'anglais sert de repli
// quand la langue du navigateur n'est pas proposée (ADR-019).
export const routing = defineRouting({
  locales: ["fr", "en", "it", "es", "de"],
  defaultLocale: "en",
  localePrefix: "always",
  pathnames: {
    "/": "/",
  },
});

export type AppLocale = (typeof routing.locales)[number];
