import { defineRouting } from "next-intl/routing";

// Langues proposées (ADR-018). Le français est la langue de rédaction ; l'anglais sert de repli
// quand la langue du navigateur n'est pas proposée (ADR-019).
export const routing = defineRouting({
  locales: ["fr", "en", "it", "es", "de"],
  defaultLocale: "en",
  localePrefix: "always",
  // Chemins traduits (US-41) : clé = chemin interne (dossier dans `app/[locale]`).
  pathnames: {
    "/": "/",
    "/tarifs": {
      fr: "/tarifs",
      en: "/pricing",
      it: "/prezzi",
      es: "/precios",
      de: "/preise",
    },
    "/creer": {
      fr: "/creer",
      en: "/create",
      it: "/crea",
      es: "/crear",
      de: "/erstellen",
    },
    "/mentions-legales": {
      fr: "/mentions-legales",
      en: "/legal-notice",
      it: "/note-legali",
      es: "/aviso-legal",
      de: "/impressum",
    },
    "/cgv": {
      fr: "/cgv",
      en: "/terms",
      it: "/termini",
      es: "/condiciones",
      de: "/agb",
    },
    "/confidentialite": {
      fr: "/confidentialite",
      en: "/privacy",
      it: "/privacy",
      es: "/privacidad",
      de: "/datenschutz",
    },
    "/cookies": {
      fr: "/cookies",
      en: "/cookies",
      it: "/cookie",
      es: "/cookies",
      de: "/cookies",
    },
  },
});

export type AppPathname = keyof typeof routing.pathnames;

export type AppLocale = (typeof routing.locales)[number];
