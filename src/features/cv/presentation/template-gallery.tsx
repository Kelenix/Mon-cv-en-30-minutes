"use client";

import { CheckIcon } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";
import {
  type CountryCode,
  orderedTemplates,
  photoUsage,
  recommendedTemplates,
} from "../countries";
import { type CvTemplate, TEMPLATE_INFO } from "../templates";
import { CountrySelect, useCountryName } from "./country-select";

// Galerie des modèles de CV (Inc-15) : pays visé, conseil sur la photo, modèles recommandés
// d'abord. Sert au choix du modèle d'un CV et à la vitrine de l'accueil.

/** Miniature d'un modèle (première page d'un CV de démonstration, 600 × 848). */
export function TemplateThumbnail({
  template,
  sizes,
  className,
}: {
  template: CvTemplate;
  sizes: string;
  className?: string;
}) {
  const locale = useLocale();
  return (
    <Image
      src={`/cv-templates/${locale}/${template}.webp`}
      alt=""
      width={600}
      height={848}
      sizes={sizes}
      className={cn(
        "h-auto w-full rounded-sm bg-white ring-1 ring-border",
        className,
      )}
    />
  );
}

/** Badges d'un modèle, en texte simple : utilisables dans un bouton ou un lien. */
export function TemplateBadges({
  template,
  recommended = false,
  id,
  className,
}: {
  template: CvTemplate;
  recommended?: boolean;
  id?: string;
  className?: string;
}) {
  const t = useTranslations("cvTemplates.badges");
  const info = TEMPLATE_INFO[template];
  const badge = "rounded-full px-2.5 py-0.5 text-xs font-semibold";
  return (
    <span id={id} className={cn("flex flex-wrap gap-1.5", className)}>
      {recommended ? (
        <span className={cn(badge, "bg-success text-white")}>
          {t("recommended")}
        </span>
      ) : null}
      <span
        className={cn(
          badge,
          info.free
            ? "bg-surface text-foreground"
            : "bg-premium text-premium-foreground",
        )}
      >
        {info.free ? t("free") : t("included")}
      </span>
      {info.ats ? (
        <span className={cn(badge, "bg-primary/10 text-primary-strong")}>
          {t("ats")}
        </span>
      ) : null}
      {info.photo ? (
        <span className={cn(badge, "bg-surface text-muted-foreground")}>
          {t("photo")}
        </span>
      ) : null}
    </span>
  );
}

/**
 * Pays visé et galerie : chaque carte porte une action (bouton de choix ou lien) qui couvre toute
 * la carte par un calque, nommée par le titre visible et décrite par badges et description.
 */
export function TemplateGallery({
  country,
  onCountryChange,
  selected,
  action,
  className,
}: {
  country: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  selected?: CvTemplate;
  action: (
    template: CvTemplate,
    props: {
      "aria-describedby": string;
      className: string;
      children: ReactNode;
    },
  ) => ReactNode;
  className?: string;
}) {
  const t = useTranslations("cvTemplates");
  const nameOf = useCountryName();
  const baseId = useId();
  const recommended = recommendedTemplates(country);

  return (
    <div className={cn("grid gap-5", className)}>
      <div className="grid gap-2">
        <label htmlFor={`${baseId}-pays`} className="font-semibold">
          {t("countryLabel")}
        </label>
        <CountrySelect
          id={`${baseId}-pays`}
          value={country}
          onChange={onCountryChange}
          describedBy={`${baseId}-photo`}
        />
        <p id={`${baseId}-photo`} className="text-sm text-muted-foreground">
          {t(`photoAdvice.${photoUsage(country)}`, {
            country: nameOf(country),
          })}
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {orderedTemplates(country).map((item) => {
          const isSelected = item === selected;
          const ids = `${baseId}-${item}`;
          return (
            <li
              key={item}
              className={cn(
                "relative grid h-full min-w-0 content-start gap-2 rounded-xl p-2 wrap-break-word hyphens-auto ring-1 ring-border transition-colors hover:bg-surface has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40",
                isSelected && "bg-primary/5 ring-2 ring-primary",
              )}
            >
              <TemplateThumbnail
                template={item}
                sizes="(min-width: 1024px) 18rem, 45vw"
              />
              {action(item, {
                "aria-describedby": `${ids}-badges ${ids}-texte`,
                className:
                  "flex min-h-11 items-center gap-1.5 text-left font-semibold outline-none after:absolute after:inset-0 after:rounded-xl",
                children: (
                  <>
                    {isSelected ? (
                      <CheckIcon
                        aria-hidden="true"
                        className="size-4 text-primary"
                      />
                    ) : null}
                    {t(`names.${item}`)}
                  </>
                ),
              })}
              <TemplateBadges
                id={`${ids}-badges`}
                template={item}
                recommended={recommended.includes(item)}
              />
              <p id={`${ids}-texte`} className="text-sm text-muted-foreground">
                {t(`descriptions.${item}`)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
