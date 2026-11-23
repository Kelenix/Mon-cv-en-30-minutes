"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId } from "react";
import { cn } from "@/lib/utils";
import { type AdsConfig, adUnitPath } from "../config";
import { consentStore, useConsent } from "./consent-store";
import { loadGoogleAds } from "./google";

type Format = "banner" | "native";

/** Hauteur réservée : l'annonce n'a aucun effet de décalage (US-33 c.3). */
const HEIGHTS: Record<Format, string> = {
  banner: "min-h-[50px] md:min-h-[90px]",
  native: "min-h-28",
};

/**
 * Emplacement publicitaire signalé « Publicité » (US-33) : bannière (728 × 90 sur ordinateur,
 * 320 × 50 sur mobile) ou annonce native ; vide si aucune annonce n'est servie.
 */
export function AdSlot({
  config,
  format,
  className,
}: {
  config: AdsConfig;
  format: Format;
  className?: string;
}) {
  const t = useTranslations("ads");
  const id = `annonce-${useId().replace(/[^a-z0-9]/gi, "")}`;
  const { choice } = useConsent();

  useEffect(() => {
    if (config.mode === "simulation") {
      consentStore.request();
      return;
    }
    let slot: googletag.Slot | null = null;
    let cancelled = false;
    loadGoogleAds(config.publisherId)
      .then(() =>
        googletag.cmd.push(() => {
          if (cancelled) return;
          slot =
            format === "banner"
              ? googletag.defineSlot(
                  adUnitPath(config, "banner"),
                  [
                    [728, 90],
                    [320, 50],
                  ],
                  id,
                )
              : googletag.defineSlot(
                  adUnitPath(config, "native"),
                  ["fluid"],
                  id,
                );
          if (!slot) return;
          if (format === "banner") {
            const mapping = googletag
              .sizeMapping()
              .addSize([768, 0], [[728, 90]])
              .addSize([0, 0], [[320, 50]])
              .build();
            if (mapping) slot.defineSizeMapping(mapping);
          }
          slot.addService(googletag.pubads());
          googletag.display(slot);
        }),
      )
      // Bloqueur de publicités : l'emplacement reste vide.
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (slot) googletag.destroySlots([slot]);
    };
  }, [config, format, id]);

  return (
    <div className={cn("grid gap-1", className)}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {t("label")}
      </p>
      <div id={id} className={cn("grid place-items-center", HEIGHTS[format])}>
        {config.mode === "simulation" && choice !== null ? (
          <SimulatedAd format={format} />
        ) : null}
      </div>
    </div>
  );
}

/** Annonce de test du mode simulation : même place qu'une vraie annonce. */
function SimulatedAd({ format }: { format: Format }) {
  const t = useTranslations("ads.simulation");
  return (
    <div
      className={cn(
        "grid w-full place-content-center gap-1 rounded-xl border border-dashed border-border bg-surface px-4 text-center",
        HEIGHTS[format],
      )}
    >
      <p className="font-semibold">{t("title")}</p>
      <p className="text-sm text-muted-foreground">{t("text")}</p>
    </div>
  );
}
