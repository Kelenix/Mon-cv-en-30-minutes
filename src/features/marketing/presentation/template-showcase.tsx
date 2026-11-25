"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import { defaultCountry } from "@/features/cv/countries";
import { EMPTY_ANSWERS, saveDraft, useDraft } from "@/features/cv/draft";
import { TemplateGallery } from "@/features/cv/presentation/template-gallery";
import { useRouter } from "@/i18n/navigation";

/**
 * Vitrine des modèles (Inc-15, accueil et page « Modèles de CV ») : pays visé, modèles
 * recommandés d'abord ; un modèle choisi est gardé dans le brouillon et donné au CV créé.
 */
export function TemplateShowcase() {
  const locale = useLocale();
  const router = useRouter();
  const draft = useDraft();
  // Pays de la langue du site : la page reste générée à l'avance, sans écart à l'hydratation.
  const [country, setCountry] = useState(() => defaultCountry(locale));

  return (
    <TemplateGallery
      country={country}
      onCountryChange={setCountry}
      action={(template, props) => (
        <button
          type="button"
          onClick={() => {
            saveDraft({
              ...(draft ?? { answers: EMPTY_ANSWERS, step: 0 }),
              country,
              template,
            });
            router.push("/creer");
          }}
          {...props}
        />
      )}
    />
  );
}
