"use client";

import { usePathname } from "next/navigation";
import "./globals.css";

// Remplace la mise en page racine en cas d'erreur fatale : le fournisseur de traductions n'existe
// plus à ce niveau, d'où ce dictionnaire autonome (mêmes textes que la clé `error` des messages).
const MESSAGES = {
  fr: { title: "Une erreur est survenue", retry: "Réessayer" },
  en: { title: "Something went wrong", retry: "Try again" },
  it: { title: "Si è verificato un errore", retry: "Riprova" },
  es: { title: "Se ha producido un error", retry: "Reintentar" },
  de: { title: "Ein Fehler ist aufgetreten", retry: "Erneut versuchen" },
} as const;

type MessageLocale = keyof typeof MESSAGES;

function isMessageLocale(value: string): value is MessageLocale {
  return value in MESSAGES;
}

export default function GlobalError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const segment = usePathname().split("/")[1] ?? "";
  const locale = isMessageLocale(segment) ? segment : "en";
  const messages = MESSAGES[locale];

  return (
    <html lang={locale}>
      <body className="flex min-h-dvh flex-col items-start justify-center gap-4 p-8">
        <h1 className="text-3xl font-bold">{messages.title}</h1>
        <button
          type="button"
          onClick={() => retry()}
          className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground"
        >
          {messages.retry}
        </button>
      </body>
    </html>
  );
}
