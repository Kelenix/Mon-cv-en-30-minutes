"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { AdsConfig } from "../config";
import { consentStore, useConsent } from "./consent-store";
import { showGoogleConsentChoices } from "./google";

/**
 * Bandeau de consentement du mode simulation (US-32) : « Accepter » et « Refuser » au même
 * niveau, avant toute annonce. En production, le bandeau certifié de Google le remplace.
 */
export function SimulatedConsentBanner() {
  const t = useTranslations("ads.consent");
  const { open } = useConsent();
  if (!open) return null;

  return (
    <section
      aria-labelledby="consentement"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background shadow-card-hover"
    >
      <div className="container-page grid gap-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="grid gap-1">
          <h2 id="consentement" className="text-lg font-semibold">
            {t("title")}
          </h2>
          <p className="text-muted-foreground">
            {t("text")}{" "}
            <Link
              href="/cookies"
              className="font-medium text-primary-strong underline underline-offset-4"
            >
              {t("more")}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => consentStore.choose("denied")}>
            {t("refuse")}
          </Button>
          <Button onClick={() => consentStore.choose("granted")}>
            {t("accept")}
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Lien « Gérer les cookies » du pied de page : rouvre le choix à tout moment (US-32 c.3). */
export function ManageCookiesButton({ config }: { config: AdsConfig }) {
  const t = useTranslations("ads.consent");
  return (
    <button
      type="button"
      onClick={() =>
        config.mode === "google"
          ? void showGoogleConsentChoices(config.publisherId)
          : consentStore.manage()
      }
      className="inline-flex min-h-11 items-center text-sm text-foreground underline-offset-4 hover:underline"
    >
      {t("manage")}
    </button>
  );
}
