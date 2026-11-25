import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { Guide } from "../types";

/** Encadré d'appel à l'action d'un article : créer son CV (et sa lettre, offerte). */
export function GuideCta({
  kind,
  className,
}: {
  kind: Guide["cta"];
  className?: string;
}) {
  const t = useTranslations("guides.cta");
  return (
    <section
      className={cn(
        "rounded-2xl bg-primary p-6 text-primary-foreground",
        className,
      )}
    >
      <p className="text-xl font-semibold">
        {kind === "letter" ? t("letterTitle") : t("cvTitle")}
      </p>
      <p className="mt-2">
        {kind === "letter" ? t("letterText") : t("cvText")}
      </p>
      <Link
        href="/creer"
        className={cn(
          buttonVariants({ size: "lg" }),
          "mt-5 h-auto min-h-13 w-full bg-background py-3 text-center whitespace-normal text-primary-strong hover:bg-surface",
        )}
      >
        {t("button")}
      </Link>
    </section>
  );
}
