import { CheckCircle2Icon, ShieldCheckIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import heroIllustration from "@/assets/marketing/hero-illustration.png";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { HeroDecorations } from "./hero-decorations";

const HIGHLIGHTS = ["freeFirstCv", "noCard", "cvLanguages"] as const;

// Section principale de l'accueil (US-01, INTAKE §4.1, ADR-025). À partir de 1 280 px, le texte à
// gauche et, à droite, l'illustration officielle en grand : elle passe derrière le texte, avec
// un bord gauche fondu pour que le titre reste lisible (choix de l'utilisateur). En dessous
// (téléphone, tablette, petit portable), le texte centré puis l'image. La section remplit tout le premier écran sous l'en-tête
// (4rem, 5rem sur ordinateur). Au-delà de 1 280 px, le titre et le sous-titre sont
// proportionnels à la largeur du conteneur (unités cqi) : la composition reste la même à tous
// les niveaux de zoom du navigateur.
export function Hero() {
  const t = useTranslations("home");

  return (
    <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden bg-linear-to-b from-surface/70 to-background lg:min-h-[calc(100svh-5rem)]">
      <HeroDecorations />
      <div className="@container container-page flex w-full flex-col items-center gap-10 py-[clamp(2rem,6vh,4rem)] xl:relative xl:block">
        <div className="relative z-10 flex flex-col items-center text-center xl:max-w-[46%] xl:items-start xl:text-left">
          <p className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-primary-strong lg:px-5 lg:py-2 lg:text-base">
            <ShieldCheckIcon aria-hidden="true" className="size-5 shrink-0" />
            {t("eyebrow")}
          </p>
          <h1 className="mt-[clamp(1.25rem,2.5vh,2rem)] text-[length:clamp(2rem,8.5vw,2.75rem)] leading-[1.08] font-bold sm:text-[length:clamp(2.5rem,min(5.5vw,7vh),3.5rem)] xl:text-[length:clamp(2.25rem,min(3.85cqi,6.5vh),5rem)]">
            {t.rich("title", {
              highlight: (chunks) => (
                <span className="text-primary">{chunks}</span>
              ),
            })}
          </h1>
          <p className="mt-[clamp(1.25rem,2.5vh,2rem)] max-w-[34em] text-lg text-muted-foreground lg:text-xl xl:max-w-[85%] xl:text-[length:clamp(1.125rem,min(1.7cqi,2.3vh),1.875rem)]">
            {t("subtitle")}
          </p>
          <Link
            href="/creer"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-[clamp(1.75rem,4vh,3rem)] min-[2200px]:h-20 min-[2200px]:px-12 min-[2200px]:text-2xl lg:h-16 lg:px-10 lg:text-xl",
            )}
          >
            {t("cta")}
          </Link>
          <ul className="mt-[clamp(1.25rem,3vh,2rem)] flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium min-[2200px]:text-xl lg:text-lg xl:justify-start">
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

        {/* À partir de 1 280 px : 64 % de la largeur de l'écran (80 rem au plus, pour suivre le
            zoom), ancrée au bord droit du conteneur et débordant dans la marge (12 rem au plus). Le
            personnage commence là où le texte (46 % de la largeur) s'arrête ; seul le fond
            bleu de gauche passe sous le texte, en fondu (premier cinquième de l'image). */}
        <div className="relative w-full max-w-[40rem] xl:absolute xl:top-1/2 xl:right-[calc(-1*min(max(0px,(100vw_-_100%)/2),12rem))] xl:w-[min(64vw,80rem)] xl:max-w-none xl:-translate-y-1/2 xl:[mask-image:linear-gradient(to_right,transparent,black_20%)]">
          <div
            aria-hidden="true"
            className="absolute inset-x-[6%] inset-y-[8%] -z-10 rounded-full bg-primary/15 blur-3xl"
          />
          <Image
            src={heroIllustration}
            alt={t("illustrationAlt")}
            preload
            sizes="(min-width: 1280px) min(64vw, 80rem), min(calc(100vw - 2rem), 40rem)"
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
