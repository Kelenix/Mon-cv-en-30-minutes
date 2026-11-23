"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { markInterstitialShown } from "../actions";
import { type AdsConfig, adUnitPath } from "../config";
import { loadGoogleAds } from "./google";

/**
 * Interstitiel unique (US-34) : affiché quand l'utilisateur quitte l'aperçu de son CV par un lien
 * (jamais pendant la saisie ni la génération), une seule fois par compte. Les onglets du CV
 * (`data-google-interstitial="false"`) ne le déclenchent pas.
 */
export function InterstitialOnLeave({
  config,
  cvId,
}: {
  config: AdsConfig;
  cvId: string;
}) {
  return config.mode === "google" ? (
    <GoogleInterstitial config={config} />
  ) : (
    <SimulatedInterstitial cvId={cvId} />
  );
}

/** Format interstitiel d'Ad Manager : Google l'affiche lors de la navigation suivante. */
function GoogleInterstitial({ config }: { config: AdsConfig }) {
  useEffect(() => {
    let slot: googletag.Slot | null = null;
    const loaded = (event: googletag.events.SlotOnloadEvent) => {
      if (event.slot === slot) void markInterstitialShown();
    };
    loadGoogleAds(config.publisherId)
      .then(() =>
        googletag.cmd.push(() => {
          slot = googletag.defineOutOfPageSlot(
            adUnitPath(config, "interstitial"),
            googletag.enums.OutOfPageFormat.INTERSTITIAL,
          );
          if (!slot) return;
          slot.addService(googletag.pubads());
          googletag.pubads().addEventListener("slotOnload", loaded);
          googletag.display(slot);
        }),
      )
      .catch(() => undefined);
    return () => {
      if (!slot) return;
      googletag.pubads().removeEventListener("slotOnload", loaded);
      googletag.destroySlots([slot]);
    };
  }, [config]);
  return null;
}

/** Mode simulation : le premier lien qui quitte le CV ouvre une annonce de test, puis y mène. */
function SimulatedInterstitial({ cvId }: { cvId: string }) {
  const t = useTranslations("ads.interstitial");
  const router = useRouter();
  const [destination, setDestination] = useState<string | null>(null);
  const shown = useRef(false);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        shown.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const link = (event.target as Element | null)?.closest("a[href]");
      if (
        !(link instanceof HTMLAnchorElement) ||
        link.target === "_blank" ||
        link.dataset.googleInterstitial === "false"
      ) {
        return;
      }
      const url = new URL(link.href);
      if (
        url.origin !== location.origin ||
        url.pathname.includes(`/cv/${cvId}`)
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      shown.current = true;
      setDestination(`${url.pathname}${url.search}${url.hash}`);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [cvId]);

  function close() {
    const next = destination;
    setDestination(null);
    void markInterstitialShown();
    if (next) router.push(next);
  }

  return (
    <AlertDialog
      open={destination !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <AlertDialogContent className="max-w-lg sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            {t("title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-foreground">
            {t("text")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div
          aria-hidden="true"
          className="grid min-h-48 place-content-center rounded-xl border border-dashed border-border bg-surface text-muted-foreground"
        >
          300 × 250
        </div>
        <AlertDialogFooter>
          <Button onClick={close}>{t("close")}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
