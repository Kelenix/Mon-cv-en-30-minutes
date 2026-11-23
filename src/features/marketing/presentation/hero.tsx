import { CheckCircle2Icon, ShieldCheckIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import heroIllustration from "@/assets/marketing/hero-illustration.png";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { HeroDecorations } from "./hero-decorations";

const HIGHLIGHTS = ["freeFirstCv", "noCard", "cvLanguages"] as const;

// Section principale de l'accueil (US-01, INTAKE §4.1, ADR-025) : sur ordinateur, le texte à
// gauche et l'illustration officielle de la marque à droite ; sur téléphone et tablette, l'un
// sous l'autre. Elle remplit tout le premier écran sous l'en-tête (4rem, 5rem sur ordinateur).
export function Hero() {
  const t = useTranslations("home");

  return (
    <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden bg-linear-to-b from-surface/70 to-background lg:min-h-[calc(100svh-5rem)]">
      <HeroDecorations />
      <div className="container-page grid w-full items-center gap-10 py-[clamp(2rem,6vh,4rem)] lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-primary-strong lg:px-5 lg:py-2 lg:text-base">
            <ShieldCheckIcon aria-hidden="true" className="size-5 shrink-0" />
            {t("eyebrow")}
          </p>
          {/* Taille proportionnelle à l'écran, limitée par la hauteur pour tenir dans le
              premier écran. */}
          <h1 className="mt-[clamp(1.25rem,2.5vh,2rem)] text-[length:clamp(2rem,8.5vw,2.75rem)] leading-[1.08] font-bold sm:text-[length:clamp(2.5rem,min(5.5vw,7vh),3.5rem)] lg:text-[length:clamp(2.25rem,min(2.8vw,6vh),5rem)]">
            {t.rich("title", {
              highlight: (chunks) => (
                <span className="text-primary">{chunks}</span>
              ),
            })}
          </h1>
          <p className="mt-[clamp(1.25rem,2.5vh,2rem)] max-w-[34em] text-lg text-muted-foreground lg:text-[length:clamp(1.125rem,min(1.3vw,2.3vh),1.875rem)]">
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
          <ul className="mt-[clamp(1.25rem,3vh,2rem)] flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium min-[2200px]:text-xl lg:justify-start lg:text-lg">
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

        <div className="relative min-[1700px]:-mr-[12%]">
          {/* Halo bleu clair derrière l'illustration ; sur les écrans d'au moins 1 700 px,
              dont la marge est assez large, l'image y déborde pour équilibrer le texte. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-[6%] inset-y-[8%] -z-10 rounded-full bg-primary/15 blur-3xl"
          />
          <Image
            src={heroIllustration}
            alt={t("illustrationAlt")}
            preload
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="mx-auto h-auto w-full max-w-[40rem] lg:max-w-[56rem]"
          />
        </div>
      </div>
    </section>
  );
}
