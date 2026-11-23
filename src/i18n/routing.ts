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
    "/creer/generation": {
      fr: "/creer/generation",
      en: "/create/generating",
      it: "/crea/generazione",
      es: "/crear/generacion",
      de: "/erstellen/generierung",
    },
    "/cv": "/cv",
    "/cv/[id]": "/cv/[id]",
    "/cv/[id]/adapter": {
      fr: "/cv/[id]/adapter",
      en: "/cv/[id]/tailor",
      it: "/cv/[id]/adatta",
      es: "/cv/[id]/adaptar",
      de: "/cv/[id]/anpassen",
    },
    "/cv/[id]/linkedin": "/cv/[id]/linkedin",
    "/cv/[id]/lettre": {
      fr: "/cv/[id]/lettre",
      en: "/cv/[id]/cover-letter",
      it: "/cv/[id]/lettera",
      es: "/cv/[id]/carta",
      de: "/cv/[id]/anschreiben",
    },
    "/cv/[id]/entretien": {
      fr: "/cv/[id]/entretien",
      en: "/cv/[id]/interview",
      it: "/cv/[id]/colloquio",
      es: "/cv/[id]/entrevista",
      de: "/cv/[id]/vorstellungsgespraech",
    },
    "/connexion": {
      fr: "/connexion",
      en: "/sign-in",
      it: "/accedi",
      es: "/iniciar-sesion",
      de: "/anmelden",
    },
    "/bienvenue": {
      fr: "/bienvenue",
      en: "/welcome",
      it: "/benvenuto",
      es: "/bienvenida",
      de: "/willkommen",
    },
    "/compte": {
      fr: "/compte",
      en: "/account",
      it: "/account",
      es: "/cuenta",
      de: "/konto",
    },
    "/compte/credits": {
      fr: "/compte/credits",
      en: "/account/credits",
      it: "/account/crediti",
      es: "/cuenta/creditos",
      de: "/konto/guthaben",
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
