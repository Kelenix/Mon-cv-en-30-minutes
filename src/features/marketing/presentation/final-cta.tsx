import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Appel à l'action final, toujours visible en bas de l'accueil (INTAKE §4.4).
export function FinalCta() {
  const t = useTranslations("home");

  return (
    <section
      aria-labelledby="commencer"
      className="container-page py-16 md:py-24"
    >
      <div className="flex flex-col items-start gap-6 rounded-2xl bg-primary px-6 py-10 text-primary-foreground md:flex-row md:items-center md:justify-between md:px-12">
        <div>
          <h2
            id="commencer"
            className="text-[1.625rem] leading-tight font-bold md:text-3xl"
          >
            {t("finalCta.title")}
          </h2>
          <p className="mt-2 text-lg">{t("finalCta.subtitle")}</p>
        </div>
        <Link
          href="/creer"
          className={cn(
            buttonVariants({ size: "lg" }),
            "bg-background text-primary-strong hover:bg-surface",
          )}
        >
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
