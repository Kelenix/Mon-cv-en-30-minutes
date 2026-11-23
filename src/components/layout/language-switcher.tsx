"use client";

import { GlobeIcon } from "lucide-react";
import { hasLocale, useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Suspense, useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { saveLocalePreference } from "@/features/profile/actions";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const triggerClass = cn(buttonVariants({ variant: "ghost" }), "px-3");

/** Icône et code de la langue affichée, communs au bouton et à sa réserve de place. */
function TriggerLabel() {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <>
      <GlobeIcon aria-hidden="true" />
      {/* Le code visible fait partie du nom accessible (WCAG 2.5.3) ; masqué sur mobile. */}
      <span className="sr-only sm:not-sr-only">{locale.toUpperCase()}</span>
      <span className="sr-only">
        {t("languageSwitcher.change", { language: t(`locales.${locale}`) })}
      </span>
    </>
  );
}

// Sélecteur de langue (US-41) : conserve la page en cours ; next-intl mémorise le choix dans
// un cookie de préférence, et le profil le garde pour un compte connecté. Sur une page à
// paramètre (`/cv/[id]`), l'adresse n'est connue qu'à la requête : le bouton arrive en flux.
export function LanguageSwitcher() {
  return (
    <Suspense
      fallback={
        <span aria-hidden="true" className={triggerClass}>
          <TriggerLabel />
        </span>
      }
    >
      <LanguageMenu />
    </Suspense>
  );
}

function LanguageMenu() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  function changeLocale(value: unknown) {
    if (typeof value !== "string" || !hasLocale(routing.locales, value)) return;
    startTransition(async () => {
      await saveLocalePreference(value);
      router.replace(
        // @ts-expect-error -- motif documenté par next-intl : `pathname` et `params` viennent de
        // la page en cours, ils correspondent toujours ; le typage par chemin ne peut pas le savoir.
        { pathname, params },
        { locale: value },
      );
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={triggerClass} disabled={isPending}>
        <TriggerLabel />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-44">
        <DropdownMenuRadioGroup value={locale} onValueChange={changeLocale}>
          {routing.locales.map((option) => (
            <DropdownMenuRadioItem
              key={option}
              value={option}
              lang={option}
              className="min-h-11 px-3 text-base"
            >
              {t(`locales.${option}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
