import { CheckCircle2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { HeroIllustration } from "./hero-illustration";

const HIGHLIGHTS = ["freeFirstCv", "fiveQuestions", "noCard"] as const;

// Section principale de l'accueil (US-01, INTAKE §4.1).
export function Hero() {
  const t = useTranslations("home");

  return (
    <section className="bg-linear-to-b from-surface/70 to-background">
      <div className="container-page grid items-center gap-10 py-14 md:py-20 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="text-[2rem] leading-[1.15] font-bold md:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground md:text-xl">
            {t("subtitle")}
          </p>
          <Link
            href="/creer"
            className={`${buttonVariants({ size: "lg" })} mt-8`}
          >
            {t("cta")}
          </Link>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
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
        <div className="flex justify-center">
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}
