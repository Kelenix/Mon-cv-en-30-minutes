import { CheckCircle2Icon } from "lucide-react";
import Image from "next/image";
import heroIllustration from "@/assets/marketing/hero-illustration.png";

/**
 * Colonne de la marque des écrans à contenu court (connexion, bienvenue, génération, erreurs) :
 * sur ordinateur, l'illustration officielle et les atouts du service occupent l'espace à droite
 * (docs/design/design-system.md §4) ; masquée sur mobile.
 */
export function BrandAside({ points = [] }: { points?: string[] }) {
  return (
    <aside className="hidden content-center justify-items-center gap-8 self-stretch rounded-3xl bg-linear-to-br from-surface via-surface to-primary/15 p-10 lg:grid">
      <Image
        src={heroIllustration}
        alt=""
        sizes="(min-width: 1024px) 45vw, 1px"
        className="h-auto w-full max-w-[36rem]"
      />
      {points.length > 0 ? (
        <ul className="grid gap-3 text-lg font-medium">
          {points.map((point) => (
            <li key={point} className="flex items-center gap-3">
              <CheckCircle2Icon
                aria-hidden="true"
                className="size-6 shrink-0 text-primary"
              />
              {point}
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

/** Disposition en deux colonnes : contenu à gauche, colonne de la marque à droite. */
export const SPLIT_LAYOUT =
  "grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start";

/** Atouts affichés dans la colonne de la marque (textes de l'accueil, espace `home`). */
export const BRAND_POINTS = [
  "eyebrow",
  "highlights.freeFirstCv",
  "highlights.noCard",
  "highlights.cvLanguages",
] as const;
