"use client";

import { CheckIcon, SparklesIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const STORAGE_KEY = "mon-cv-30s:encart-offres-ferme";
const FEATURES = ["adapt", "letter", "linkedin", "interview"] as const;

let closed = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isClosed() {
  try {
    return closed || localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return closed;
  }
}

function close() {
  closed = true;
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Stockage refusé : l'encart reste fermé pour cette visite.
  }
  for (const listener of listeners) listener();
}

/**
 * Encart des fonctions avancées (US-15), non bloquant et refermable : uniquement sur l'aperçu,
 * donc après une génération réussie (aucune offre pendant la saisie). Les abonnés ne verront
 * que les formules supérieures à la leur dès que les abonnements existeront (Inc-6).
 */
export function UpsellCard() {
  const t = useTranslations("upsell");
  // Masqué dans le HTML du serveur, qui ne sait pas si l'encart a été fermé.
  const hidden = useSyncExternalStore(subscribe, isClosed, () => true);
  if (hidden) return null;

  return (
    <aside
      aria-labelledby="encart-offres"
      className="relative grid gap-3 rounded-2xl border border-primary/30 bg-surface p-5"
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("close")}
        onClick={close}
        className="absolute top-2 right-2"
      >
        <XIcon aria-hidden="true" />
      </Button>
      <h2
        id="encart-offres"
        className="flex items-center gap-2 pe-10 text-lg font-bold"
      >
        <SparklesIcon aria-hidden="true" className="size-5 text-primary" />
        {t("title")}
      </h2>
      <p>{t("intro")}</p>
      <ul className="grid gap-2">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex gap-2">
            <CheckIcon
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-primary"
            />
            {t(`features.${feature}`)}
          </li>
        ))}
      </ul>
      <Link
        href="/tarifs"
        className={buttonVariants({ className: "justify-self-start" })}
      >
        {t("cta")}
      </Link>
    </aside>
  );
}
