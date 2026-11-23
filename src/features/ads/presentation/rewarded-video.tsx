"use client";

import { PlayCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { issueRewardToken, redeemRewardToken } from "../actions";
import { type AdsConfig, adUnitPath, SIMULATED_AD_SECONDS } from "../config";
import { loadGoogleAds } from "./google";

type Status =
  | "idle"
  | "loading"
  | "playing"
  | "done"
  | "interrupted"
  | "unavailable"
  | "limit"
  | "error";

/**
 * « Regarde une courte annonce pour obtenir 1 crédit IA. » (US-35, H26) : jeton demandé au
 * serveur, annonce vue jusqu'au bout, puis 1 crédit acheté ; rien si l'annonce est interrompue.
 */
export function RewardedVideo({ config }: { config: AdsConfig }) {
  const t = useTranslations("ads.rewarded");
  const [status, setStatus] = useState<Status>("idle");
  const [seconds, setSeconds] = useState(SIMULATED_AD_SECONDS);
  const token = useRef("");

  async function redeem() {
    setStatus("loading");
    const result = await redeemRewardToken({ token: token.current });
    setStatus(
      result.ok
        ? "done"
        : result.error.code === "RATE_LIMITED"
          ? "limit"
          : "error",
    );
  }

  async function start() {
    setStatus("loading");
    const issued = await issueRewardToken();
    if (!issued.ok) {
      setStatus(issued.error.code === "RATE_LIMITED" ? "limit" : "error");
      return;
    }
    token.current = issued.data.token;
    if (config.mode === "simulation") {
      setSeconds(SIMULATED_AD_SECONDS);
      setStatus("playing");
    } else {
      playGoogleAd();
    }
  }

  /** Annonce récompensée Ad Manager : affichée quand elle est prête, récompense accordée par Google. */
  function playGoogleAd() {
    loadGoogleAds(config.publisherId)
      .then(() =>
        googletag.cmd.push(() => {
          const slot = googletag.defineOutOfPageSlot(
            adUnitPath(config, "rewarded"),
            googletag.enums.OutOfPageFormat.REWARDED,
          );
          if (!slot) {
            setStatus("unavailable");
            return;
          }
          const pubads = googletag.pubads();
          let granted = false;
          const ready = (event: googletag.events.RewardedSlotReadyEvent) => {
            if (event.slot !== slot) return;
            setStatus("playing");
            event.makeRewardedVisible();
          };
          const grant = (event: googletag.events.RewardedSlotGrantedEvent) => {
            if (event.slot === slot) granted = true;
          };
          const end = (outcome: Status | "granted") => {
            pubads.removeEventListener("rewardedSlotReady", ready);
            pubads.removeEventListener("rewardedSlotGranted", grant);
            pubads.removeEventListener("rewardedSlotClosed", close);
            pubads.removeEventListener("slotRenderEnded", empty);
            googletag.destroySlots([slot]);
            if (outcome === "granted") void redeem();
            else setStatus(outcome);
          };
          const close = (event: googletag.events.RewardedSlotClosedEvent) => {
            if (event.slot === slot) end(granted ? "granted" : "interrupted");
          };
          const empty = (event: googletag.events.SlotRenderEndedEvent) => {
            if (event.slot === slot && event.isEmpty) end("unavailable");
          };
          pubads.addEventListener("rewardedSlotReady", ready);
          pubads.addEventListener("rewardedSlotGranted", grant);
          pubads.addEventListener("rewardedSlotClosed", close);
          pubads.addEventListener("slotRenderEnded", empty);
          slot.addService(pubads);
          googletag.display(slot);
        }),
      )
      // Bloqueur de publicités ou réseau : aucune annonce, sans erreur.
      .catch(() => setStatus("unavailable"));
  }

  // Annonce de test : compte à rebours, puis crédit à la fin.
  const simulated = config.mode === "simulation" && status === "playing";
  const finished = useEffectEvent(() => void redeem());
  useEffect(() => {
    if (!simulated) return;
    const timer = setTimeout(() => {
      setSeconds(seconds - 1);
      if (seconds === 1) finished();
    }, 1_000);
    return () => clearTimeout(timer);
  }, [simulated, seconds]);

  const busy = status === "loading" || status === "playing";
  const message =
    status === "idle" || status === "loading"
      ? ""
      : status === "playing"
        ? t("playing")
        : t(status);

  return (
    <div className="grid justify-items-start gap-3 rounded-xl border border-border p-4">
      <p>{t("offer")}</p>
      <Button
        variant="outline"
        onClick={() => void start()}
        disabled={busy || status === "limit"}
        aria-busy={busy || undefined}
      >
        <PlayCircleIcon aria-hidden="true" />
        {status === "loading" ? t("loading") : t("watch")}
      </Button>
      <p role="status" className="text-sm">
        {message}
      </p>

      <AlertDialog
        open={simulated}
        onOpenChange={(open) => {
          if (!open && simulated) setStatus("interrupted");
        }}
      >
        <AlertDialogContent className="max-w-md sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              {t("dialogTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-foreground">
              {t("remaining", { seconds })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div
            aria-hidden="true"
            className="h-2 overflow-hidden rounded-full bg-surface"
          >
            <div
              className="h-full bg-primary transition-[width] duration-1000 ease-linear"
              style={{
                width: `${((SIMULATED_AD_SECONDS - seconds) / SIMULATED_AD_SECONDS) * 100}%`,
              }}
            />
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setStatus("interrupted")}>
              {t("close")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
