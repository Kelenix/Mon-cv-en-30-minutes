"use client";

import {
  GiftIcon,
  MailIcon,
  MessageCircleIcon,
  Share2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { CopyButton } from "@/features/cv/presentation/editing";
import { cn } from "@/lib/utils";

const noop = () => () => {};

/** Partage natif disponible (mobile surtout) ; faux au rendu serveur. */
function useCanShare() {
  return useSyncExternalStore(
    noop,
    () => typeof navigator.share === "function",
    () => false,
  );
}

/**
 * Parrainage (ADR-052) : lien personnel à envoyer, par WhatsApp, e-mail, partage du téléphone ou
 * copie. Avec `invited`, les résultats du parrain sont affichés (espace compte).
 */
export function ReferralCard({
  link,
  credits,
  invited,
  creditsEarned,
  className,
}: {
  link: string;
  credits: number;
  invited?: number;
  creditsEarned?: number;
  className?: string;
}) {
  const t = useTranslations("referral");
  const canShare = useCanShare();
  const message = t("message", { credits });
  const shareText = `${message} ${link}`;

  return (
    <section
      aria-labelledby="parrainage"
      className={cn(
        "rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-8",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <GiftIcon
          aria-hidden="true"
          className="mt-1 size-6 shrink-0 text-primary"
        />
        <div className="min-w-0">
          <h2 id="parrainage" className="text-xl font-semibold">
            {t("title", { credits })}
          </h2>
          <p className="mt-1 text-muted-foreground">{t("text", { credits })}</p>
        </div>
      </div>

      <p className="mt-4 rounded-lg border border-border bg-background px-3 py-2 text-sm break-all">
        {link}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <CopyButton getText={() => link} label={t("copy")} />
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          <MessageCircleIcon aria-hidden="true" />
          {t("whatsapp")}
        </a>
        <a
          href={`mailto:?subject=${encodeURIComponent(t("emailSubject"))}&body=${encodeURIComponent(shareText)}`}
          className={buttonVariants({ variant: "outline" })}
        >
          <MailIcon aria-hidden="true" />
          {t("email")}
        </a>
        {canShare ? (
          <Button
            variant="outline"
            onClick={() =>
              void navigator
                .share({ title: t("emailSubject"), text: message, url: link })
                .catch(() => undefined)
            }
          >
            <Share2Icon aria-hidden="true" />
            {t("share")}
          </Button>
        ) : null}
      </div>

      {invited !== undefined ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {t("stats", { invited, credits: creditsEarned ?? 0 })}
        </p>
      ) : null}
    </section>
  );
}
