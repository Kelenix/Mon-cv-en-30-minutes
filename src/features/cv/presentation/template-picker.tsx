"use client";

import { ExternalLinkIcon, LayoutTemplateIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { setCvLayout } from "../actions";
import type { CountryCode } from "../countries";
import { type CvTemplate, TEMPLATE_INFO } from "../templates";
import { PhotoField } from "./photo-field";
import {
  TemplateBadges,
  TemplateGallery,
  TemplateThumbnail,
} from "./template-gallery";

/**
 * Modèle du CV (Inc-15) : modèle actuel, galerie par pays pour en changer (enregistré aussitôt),
 * aperçu du PDF dans un nouvel onglet. Tout modèle s'essaie ; le téléchargement d'un modèle
 * payant demande une formule ou CV Pro (vérifié par le serveur).
 */
export function TemplatePicker({
  cvId,
  template,
  onChange,
  initialCountry,
  hasPhoto,
  ready,
}: {
  cvId: string;
  template: CvTemplate;
  onChange: (template: CvTemplate) => void;
  initialCountry: CountryCode;
  /** Photo déjà posée sur ce CV (US-45). */
  hasPhoto: boolean;
  /** Aperçu possible : aucune modification en attente d'enregistrement. */
  ready: boolean;
}) {
  const t = useTranslations("cvTemplates");
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState(initialCountry);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function save(
    changes: { template?: CvTemplate; targetCountry?: CountryCode },
    undo: () => void,
  ) {
    setError(false);
    startTransition(async () => {
      const result = await setCvLayout({ cvId, ...changes });
      if (!result.ok) {
        undo();
        setError(true);
      }
    });
  }

  function choose(next: CvTemplate) {
    setOpen(false);
    if (next === template) return;
    const previous = template;
    onChange(next);
    save({ template: next }, () => onChange(previous));
  }

  function changeCountry(next: CountryCode) {
    const previous = country;
    setCountry(next);
    save({ targetCountry: next }, () => setCountry(previous));
  }

  return (
    <section
      aria-label={t("label")}
      className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-background p-3 sm:p-4"
    >
      <div className="w-14 shrink-0">
        <TemplateThumbnail template={template} sizes="3.5rem" />
      </div>
      <div className="grid min-w-0 flex-1 gap-1.5">
        <p className="text-sm text-muted-foreground">
          {t("label")} ·{" "}
          <span className="font-semibold text-foreground">
            {t(`names.${template}`)}
          </span>
        </p>
        <TemplateBadges template={template} />
        {TEMPLATE_INFO[template].ats ? null : (
          <p className="text-sm text-muted-foreground">{t("atsWarning")}</p>
        )}
        {TEMPLATE_INFO[template].photo ? (
          <PhotoField cvId={cvId} initialHasPhoto={hasPhoto} />
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {t("error")}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            className={buttonVariants({ variant: "outline" })}
            disabled={pending}
          >
            <LayoutTemplateIcon aria-hidden="true" />
            {t("change")}
          </DialogTrigger>
          <DialogContent closeLabel={t("close")} className="max-w-5xl">
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
            <DialogDescription>{t("dialogText")}</DialogDescription>
            <TemplateGallery
              country={country}
              onCountryChange={changeCountry}
              selected={template}
              action={(item, props) => (
                <button
                  type="button"
                  aria-pressed={item === template}
                  onClick={() => choose(item)}
                  {...props}
                />
              )}
            />
          </DialogContent>
        </Dialog>
        {ready && !pending ? (
          <a
            href={`/api/cv/${cvId}/export?format=pdf&apercu=1`}
            target="_blank"
            rel="noopener"
            className={buttonVariants({ variant: "ghost" })}
          >
            <ExternalLinkIcon aria-hidden="true" />
            {t("preview")}
          </a>
        ) : (
          <Button variant="ghost" disabled>
            <ExternalLinkIcon aria-hidden="true" />
            {t("preview")}
          </Button>
        )}
      </div>
    </section>
  );
}
