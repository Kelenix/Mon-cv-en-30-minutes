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
 * Exports du CV (US-16, US-17) : PDF pour tous ; DOCX avec les droits, sinon explication pour
 * le débloquer (le serveur le refuse de toute façon). Inactifs tant qu'une modification n'est
 * pas enregistrée, pour que le fichier reflète l'aperçu.
 */
export function ExportButtons({
  cvId,
  unlocked,
  ready,
}: {
  cvId: string;
  unlocked: boolean;
  ready: boolean;
}) {
  const t = useTranslations("cvExport");
  const format = useFormatter();

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

  return (
    <>
      {download("pdf", t("pdf"))}
      {unlocked ? (
        download("docx", t("docx"))
      ) : (
        <Popover>
          <PopoverTrigger
            aria-label={t("docxLockedLabel")}
            className={buttonVariants({ variant: "outline" })}
          >
            <LockIcon aria-hidden="true" />
            {t("docxLocked")}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 gap-3 p-4 text-base">
            <PopoverTitle className="text-base font-semibold">
              {t("lockedTitle")}
            </PopoverTitle>
            <PopoverDescription className="text-foreground">
              {t("lockedText", {
                price: format.number(centsToEuros(CV_PRO_PRICE_CENTS), {
                  style: "currency",
                  currency: "EUR",
                }),
              })}
            </PopoverDescription>
            <Link href="/tarifs" className={buttonVariants()}>
              {t("seeOffers")}
            </Link>
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}
