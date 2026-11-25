"use client";

import { DownloadIcon, LockIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { centsToEuros, CV_PRO_PRICE_CENTS } from "@/features/plans/catalog";
import { Link } from "@/i18n/navigation";

type Format = "pdf" | "docx";

/**
 * Exports du CV (US-16, US-17) : PDF pour tous avec un modèle gratuit ; DOCX, et PDF d'un modèle
 * payant (Inc-15), avec les droits, sinon explication pour les débloquer (le serveur les refuse
 * de toute façon). Inactifs tant qu'une modification n'est pas enregistrée, pour que le fichier
 * reflète l'aperçu.
 */
export function ExportButtons({
  cvId,
  unlocked,
  templateLocked,
  ready,
}: {
  cvId: string;
  unlocked: boolean;
  /** Modèle payant choisi sans droit : PDF en aperçu seulement. */
  templateLocked: boolean;
  ready: boolean;
}) {
  const t = useTranslations("cvExport");
  const format = useFormatter();
  const price = format.number(centsToEuros(CV_PRO_PRICE_CENTS), {
    style: "currency",
    currency: "EUR",
  });

  function download(type: Format, label: string) {
    const className = buttonVariants({
      variant: type === "pdf" ? "default" : "outline",
    });
    const content = (
      <>
        <DownloadIcon aria-hidden="true" />
        {label}
      </>
    );
    return ready ? (
      <a
        href={`/api/cv/${cvId}/export?format=${type}`}
        download
        className={className}
      >
        {content}
      </a>
    ) : (
      <Button variant={type === "pdf" ? "default" : "outline"} disabled>
        {content}
      </Button>
    );
  }

  function locked({
    label,
    ariaLabel,
    title,
    text,
    primary,
  }: {
    label: string;
    ariaLabel: string;
    title: string;
    text: string;
    primary?: boolean;
  }) {
    return (
      <Popover>
        <PopoverTrigger
          aria-label={ariaLabel}
          className={buttonVariants({
            variant: primary ? "default" : "outline",
          })}
        >
          <LockIcon aria-hidden="true" />
          {label}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 gap-3 p-4 text-base">
          <PopoverTitle className="text-base font-semibold">
            {title}
          </PopoverTitle>
          <PopoverDescription className="text-foreground">
            {text}
          </PopoverDescription>
          <Link href="/tarifs" className={buttonVariants()}>
            {t("seeOffers")}
          </Link>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
      {templateLocked
        ? locked({
            label: t("pdfLocked"),
            ariaLabel: t("pdfLockedLabel"),
            title: t("templateLockedTitle"),
            text: t("templateLockedText", { price }),
            primary: true,
          })
        : download("pdf", t("pdf"))}
      {unlocked
        ? download("docx", t("docx"))
        : locked({
            label: t("docxLocked"),
            ariaLabel: t("docxLockedLabel"),
            title: t("lockedTitle"),
            text: t("lockedText", { price }),
          })}
    </>
  );
}
