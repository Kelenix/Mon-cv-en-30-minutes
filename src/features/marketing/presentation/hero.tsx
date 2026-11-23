import { CheckCircle2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { HeroDecorations } from "./hero-decorations";

const HIGHLIGHTS = ["freeFirstCv", "fiveQuestions", "noCard"] as const;

// Section principale de l'accueil (US-01, INTAKE §4.1), structure fournie par l'utilisateur
// (ADR-024) : contenu centré, entouré de formes décoratives. Elle remplit tout le premier écran
// sous l'en-tête (4rem), quelle que soit sa taille. Le titre et le sous-titre sont
// proportionnels à la largeur et à la hauteur de la fenêtre (bornés), et la largeur du titre
// est en `em` : la composition reste la même du portable à l'écran 4K.
export function Hero() {
  const t = useTranslations("home");

  return (
    <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden bg-linear-to-b from-surface/70 to-background">
      <HeroDecorations />
      <div className="mx-auto flex w-full flex-col items-center px-4 py-[clamp(1.5rem,6vh,4rem)] text-center sm:px-8">
        {/* Téléphone : taille liée à la largeur (le mot le plus long tient sur une ligne).
            À partir de 640 px : 6,4 % de la largeur, limité par la hauteur ; avec une largeur
            de 13,6 em, le titre français garde le même découpage en trois lignes. */}
        <h1 className="max-w-[13.6em] text-[length:clamp(1.75rem,min(10.5vw,6vh),2.5rem)] leading-[1.06] font-bold sm:text-[length:clamp(1.75rem,min(6.4vw,9vh),8rem)]">
          {t("title")}
        </h1>
        <p className="mt-[0.8em] max-w-[36em] text-[length:clamp(1.125rem,min(1.5vw,2.7vh),1.875rem)] text-muted-foreground">
          {t("subtitle")}
        </p>
        <Link
          href="/creer"
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-[clamp(1.5rem,5vh,3rem)] lg:h-16 lg:px-10 lg:text-xl 2xl:h-18 2xl:px-12 2xl:text-2xl",
          )}
        >
          {t("cta")}
        </Link>
        <ul className="mt-[clamp(1rem,3vh,2rem)] flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium lg:text-base 2xl:text-lg">
          {HIGHLIGHTS.map((highlight) => (
            <li key={highlight} className="inline-flex items-center gap-2">
              <CheckCircle2Icon
                aria-hidden="true"
                className="size-5 text-success"
              />
              {t(`highlights.${highlight}`)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
