import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/** CV absent ou d'un autre compte (la RLS le rend introuvable) : lien vers « Mes CV ». */
export function CvNotFound() {
  const t = useTranslations("cvEditor");
  return (
    <div className="grid max-w-xl gap-6 py-10">
      <h1 className="text-[1.75rem] leading-tight font-bold">
        {t("notFound")}
      </h1>
      <Link
        href="/cv"
        className={buttonVariants({ className: "justify-self-start" })}
      >
        {t("myCvs")}
      </Link>
    </div>
  );
}
